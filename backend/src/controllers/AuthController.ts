import { Controller, Post, Get, Put, Middleware } from "@overnightjs/core";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../models/User";
// 1. Impor middleware dan interface AuthenticatedRequest
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth"; // Pastikan path ini benar
import { error } from "console";

@Controller("api/users")
export class AuthController {
  // Endpoint ini tetap publik, tidak perlu middleware
  @Post("register")
  private async register(req: Request, res: Response) {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    try {
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ error: "Username is already taken" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const newUser = await User.create({
        username,
        password: hashedPassword,
        status: "pending",
        role: null,
      });

      res
        .status(201)
        .json({ message: "User registered successfully, pending approval." });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to register user" });
    }
  }

  // Endpoint ini sekarang dilindungi oleh middleware
  @Get("pending")
  @Middleware(authMiddleware)
  private async getPendingUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const pendingUsers = await User.findAll({
        where: { status: "pending" },
        attributes: ["id", "username", "status", "createdAt"],
      });
      res.json(pendingUsers);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch pending users" });
    }
  }

  // Endpoint ini juga dilindungi oleh middleware
  @Put("approve/:id")
  @Middleware(authMiddleware)
  private async approveUser(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { role } = req.body;
    // console.log(role);
    if (!role) {
      return res.status(400).json({ error: "Role is required" });
    }

    try {
      const user = await User.findByPk(id);
      const validRoles = ["admin", "fcl", "leader", "sports"];
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (!validRoles.includes(role)) {
        return res.status(400).json({
          error: `Invalid role specified. Must be one of: ${validRoles.join(
            ", "
          )}`,
        });
      }
      user.status = "approved";
      user.role = role;
      await user.save();

      res.json({
        message: `User ${user.username} has been approved as ${role}.`,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to approve user" });
    }
  }

  // Endpoint login juga tetap publik
  @Post("login")
  private async login(req: Request, res: Response): Promise<any> {
    const { username, password } = req.body;

    if (!username || !password) {
      return res
        .status(400)
        .json({ error: "Username and password are required" });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    if (user.status !== "approved") {
      return res.status(403).json({
        error: "Your account has not been approved by an administrator yet.",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      "your-jwt-secret",
      { expiresIn: "1h" }
    );

    res.json({
      message: "Login successful",
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  }
}
