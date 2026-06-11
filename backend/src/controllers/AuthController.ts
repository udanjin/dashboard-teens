import { Controller, Post, Get, Put, Middleware, Delete } from "@overnightjs/core";
import { Request, Response } from "express";
import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/roleAuth";
import { User, Role } from "../models";
import {
  PERMISSIONS,
  getPermissionsForRoles,
} from "../types";
import type {
  AuthenticatedRequest,
  LoginRequestBody,
  RegisterRequestBody,
  UserResponse,
} from "../types";

const COOKIE_NAME = "authToken";
const TOKEN_EXPIRY = "8h";
const COOKIE_MAX_AGE = 8 * 60 * 60 * 1000;

function setCookieToken(res: Response, token: string): void {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

function clearCookieToken(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
}

@Controller("api/auth")
export class AuthController {
  @Post("register")
  private async register(req: Request, res: Response): Promise<any> {
    const { username, password, dob, accountType, gender, grade } =
      req.body as RegisterRequestBody;

    if (!username || !password || !dob || !accountType) {
      return res.status(400).json({
        error: "Username, password, date of birth, and account type are required",
      });
    }

    if (accountType === "leader" && (!gender || !grade)) {
      return res.status(400).json({
        error: "Gender and grade are required for leader accounts",
      });
    }

    try {
      const existing = await User.findOne({ where: { username } });
      if (existing) {
        return res.status(409).json({ error: "Username is already taken" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await User.create({
        username,
        password: hashedPassword,
        status: "pending",
        gender,
        grade,
        dob,
      });

      res.status(201).json({ message: "Registration successful, pending approval." });
    } catch (err) {
      console.error("Register error:", err);
      res.status(500).json({ error: "Failed to register user" });
    }
  }

  @Post("login")
  private async login(req: Request, res: Response): Promise<any> {
    const { username, password } = req.body as LoginRequestBody;

    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    try {
      const user = await User.findOne({
        where: { username },
        include: [
          {
            model: Role,
            as: "roles",
            attributes: ["name"],
            through: { attributes: [] },
          },
        ],
      });

      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      if (user.status !== "approved") {
        return res.status(403).json({
          error: "Your account has not been approved yet.",
        });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      const roleNames = user.roles?.map((r) => r.name) ?? [];
      const permissions = getPermissionsForRoles(roleNames);

      const payload = {
        userId: user.id,
        username: user.username,
        name: user.username,
        roles: roleNames,
        permissions,
        gender: user.gender,
        grade: user.grade,
      };

      const token = jwt.sign(payload, process.env.JWT_SECRET!, {
        expiresIn: TOKEN_EXPIRY,
      });

      setCookieToken(res, token);

      const userResponse: UserResponse = {
        id: user.id,
        username: user.username,
        name: user.username,
        roles: roleNames,
        permissions,
        gender: user.gender,
        grade: user.grade,
      };

      res.json({ message: "Login successful", user: userResponse });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Login failed" });
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
      const pendingUsers = await User.findAll({
        where: { status: "pending" },
        attributes: ["id", "username", "status", "createdAt"],
      });
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
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.APPROVAL_MANAGE)])
  private async approveUser(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const { roleIds } = req.body;

    try {
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      user.status = "approved";
      await user.save();
      await (user as any).setRoles(roleIds);

      res.json({ message: `User ${user.username} has been approved.` });
    } catch (err) {
      console.error("Approve user error:", err);
      res.status(500).json({ error: "Failed to approve user" });
    }
  }

  @Delete("reject/:id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.APPROVAL_MANAGE)])
  private async rejectUser(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;

    try {
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.status !== "pending") {
        return res.status(400).json({ error: "User is not in a pending state." });
      }

      const { username } = user;
      await user.destroy();

      res.json({ message: `Registration for '${username}' has been rejected.` });
    } catch (err) {
      console.error("Reject user error:", err);
      res.status(500).json({ error: "Failed to reject user" });
    }
  }
}
