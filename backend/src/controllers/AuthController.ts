import { Controller, Post, Get, Put, Middleware, Delete } from "@overnightjs/core";
import { Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/roleAuth";
import { AuthService } from "../services/AuthService";
import { registerSchema, loginSchema, approveUserSchema } from "../dtos/Auth.dto";
import { PERMISSIONS } from "../types";
import type { AuthenticatedRequest } from "../types";

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
  private async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = registerSchema.parse(req.body);
      await AuthService.register(data);
      res.status(201).json({ message: "Registration successful, pending approval." });
    } catch (err) {
      next(err);
    }
  }

  @Post("login")
  private async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = loginSchema.parse(req.body);
      const result = await AuthService.login(data);
      setCookieToken(res, result.token);
      res.json({ message: "Login successful", user: result.user });
    } catch (err) {
      next(err);
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
    res.json({ id: userId, username, name, roles, permissions, gender, grade });
  }

  @Get("pending")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.APPROVAL_VIEW)])
  private async getPendingUsers(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const pendingUsers = await AuthService.getPendingUsers();
      res.json(pendingUsers);
    } catch (err) {
      next(err);
    }
  }

  @Get("roles")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.APPROVAL_MANAGE)])
  private async getAllRoles(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = await AuthService.getAllRoles();
      res.json(roles);
    } catch (err) {
      next(err);
    }
  }

  @Put("approve/:id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.APPROVAL_MANAGE)])
  private async approveUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const data = approveUserSchema.parse(req.body);
      const user = await AuthService.approveUser(id, data.roleIds);
      res.json({ message: `User ${user.username} has been approved.` });
    } catch (err) {
      next(err);
    }
  }

  @Delete("reject/:id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.APPROVAL_MANAGE)])
  private async rejectUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const username = await AuthService.rejectUser(id);
      res.json({ message: `Registration for '${username}' has been rejected.` });
    } catch (err) {
      next(err);
    }
  }
}

