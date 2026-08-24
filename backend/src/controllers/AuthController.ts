import { Controller, Post, Get, Put, Middleware, Delete } from "@overnightjs/core";
import { Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/roleAuth";
import { validate } from "../middleware/validate";
import { registerSchema, loginSchema, approveUserSchema } from "../validators/auth.validator";
import { AuthService } from "../services/AuthService";
import { Role } from "../models";
import {
  PERMISSIONS,
} from "../types";
import type {
  AuthenticatedRequest,
  LoginRequestBody,
  RegisterRequestBody,
  UserResponse,
} from "../types";

const COOKIE_NAME = "authToken";
const COOKIE_MAX_AGE = 8 * 60 * 60 * 1000;

function setCookieToken(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

function clearCookieToken(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
  });
}

@Controller("api/auth")
export class AuthController {
  @Post("register")
  @Middleware([validate(registerSchema)])
  private async register(req: Request, res: Response): Promise<any> {
    const data = req.body as RegisterRequestBody;

    try {
      await AuthService.registerUser(data);
      res.status(201).json({ message: "Registration successful, pending approval." });
    } catch (err: any) {
      console.error("Register error:", err);
      if (err.message === "Username is already taken") {
        return res.status(409).json({ error: err.message });
      }
      res.status(500).json({ error: "Failed to register user" });
    }
  }

  @Post("login")
  @Middleware([validate(loginSchema)])
  private async login(req: Request, res: Response): Promise<any> {
    const data = req.body as LoginRequestBody;

    try {
      const { token, user } = await AuthService.loginUser(data);
      setCookieToken(res, token);
      res.json({ message: "Login successful", user });
    } catch (err: any) {
      console.error("Login error:", err);
      const status = err.message.includes("approved") ? 403 : 401;
      res.status(status).json({ error: err.message || "Login failed" });
    }
  }

  @Post("logout")
  private logout(_req: Request, res: Response): void {
    clearCookieToken(res);
    res.json({ message: "Logged out successfully" });
  }

  @Get("me")
  @Middleware(authMiddleware)
  private getMe(req: AuthenticatedRequest, res: Response): void {
    const { userId, username, name, roles, permissions, gender, grade } = req.user!;

    const userResponse: UserResponse = {
      id: userId,
      username,
      name,
      roles,
      permissions,
      gender,
      grade,
    };

    res.json(userResponse);
  }

  @Get("pending")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.APPROVAL_VIEW)])
  private async getPendingUsers(_req: AuthenticatedRequest, res: Response) {
    try {
      const pendingUsers = await AuthService.getPendingUsers();
      res.json(pendingUsers);
    } catch (err) {
      console.error("Fetch pending users error:", err);
      res.status(500).json({ error: "Failed to fetch pending users" });
    }
  }

  @Get("roles")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.APPROVAL_MANAGE)])
  private async getAllRoles(_req: AuthenticatedRequest, res: Response) {
    try {
      const roles = await Role.findAll({ attributes: ["id", "name"] });
      res.json(roles);
    } catch (err) {
      console.error("Fetch roles error:", err);
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  }

  @Put("approve/:id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.APPROVAL_MANAGE), validate(approveUserSchema)])
  private async approveUser(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const { roleIds } = req.body;

    try {
      const user = await AuthService.approveUser(parseInt(id, 10), roleIds);
      res.json({ message: `User ${user.username} has been approved.` });
    } catch (err: any) {
      console.error("Approve user error:", err);
      if (err.message === "User not found") return res.status(404).json({ error: err.message });
      res.status(500).json({ error: "Failed to approve user" });
    }
  }

  @Delete("reject/:id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.APPROVAL_MANAGE)])
  private async rejectUser(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;

    try {
      const username = await AuthService.rejectUser(parseInt(id, 10));
      res.json({ message: `Registration for '${username}' has been rejected.` });
    } catch (err: any) {
      console.error("Reject user error:", err);
      if (err.message === "User not found") return res.status(404).json({ error: err.message });
      if (err.message.includes("pending state")) return res.status(400).json({ error: err.message });
      res.status(500).json({ error: "Failed to reject user" });
    }
  }
}
