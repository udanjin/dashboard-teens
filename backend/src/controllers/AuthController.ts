import {
  Controller,
  Post,
  Get,
  Put,
  Middleware,
  Delete,
} from "@overnightjs/core";
import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// 1. Impor middleware dan interface AuthenticatedRequest
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth"; // Pastikan path ini benar
import { error } from "console";
import Member from "../models/Member";
import { User, Role } from "../models";

@Controller("api/users")
export class AuthController {
  // Endpoint ini tetap publik, tidak perlu middleware
  @Post("register")
  private async register(req: Request, res: Response) {
    // Destructure all possible fields from the request body
    const { username, password, dob, accountType, gender, grade } = req.body;

    // --- 1. Validation ---
    if (!username || !password || !dob || !accountType) {
      return res.status(400).json({
        error: "Username, password, DoB, and account type are required",
      });
    }

    // Conditional validation: if they register as a leader, gender and grade are required
    if (accountType === "leader" && (!gender || !grade)) {
      return res.status(400).json({
        error: "Gender and grade are required for the Leader account type",
      });
    }

    try {
      // Check if username already exists
      const existingUser = await User.findOne({ where: { username } });
      if (existingUser) {
        return res.status(400).json({ error: "Username is already taken" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // --- 2. Prepare User Data ---
      const userData: any = {
        username,
        password: hashedPassword,
        status: "pending", // Always pending on initial registration
        gender,
        grade,
        dob,
        // The role is NOT set here. It will be set by an admin during approval.
      };
      await User.create(userData);

      res
        .status(201)
        .json({ message: "User registered successfully, pending approval." });
    } catch (err) {
      console.error("Failed to register user:", err);
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
  @Get("roles")
  @Middleware(authMiddleware)
  private async getAllRoles(req: AuthenticatedRequest, res: Response) {
    try {
      const roles = await Role.findAll({ attributes: ["id", "name"] });
      res.json(roles);
    } catch (err) {
      console.error("Failed to fetch roles:", err);
      res.status(500).json({ error: "Failed to fetch roles" });
    }
  }
  // Endpoint ini juga dilindungi oleh middleware
  @Put("approve/:id")
  @Middleware(authMiddleware)
  private async approveUser(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const { roleIds } = req.body;

    try {
      const user = await User.findByPk(id);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Hanya ubah status, jangan sentuh role
      user.status = "approved";

      await user.save();
      await (user as any).setRoles(roleIds);
      res.json({
        message: `User ${user.username} has been approved with their chosen role.`,
      });
    } catch (err) {
      console.error("Failed to approve user:", err);
      res.status(500).json({ error: "Failed to approve user" });
    }
  }
  @Delete("reject/:id")
  @Middleware(authMiddleware)
  private async rejectUser(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    try {
      const user = await User.findByPk(id);
      if (!user) {
        return res.status(404).json({ error: "user not found" });
      }
      if (user.status !== "pending") {
        return res
          .status(400)
          .json({ error: `User is not in a pending state.` });
      }
      const username = user.username; // Store username for the response message
      await user.destroy(); // Delete the user from the database

      res.json({
        message: `User registration for '${username}' has been rejected and removed.`,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to reject user" });
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

    // Mengambil user beserta relasi roles-nya dalam satu query
    const userWithRoles = await User.findOne({
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

    if (!userWithRoles) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    if (userWithRoles.status !== "approved") {
      return res.status(403).json({
        error: "Your account has not been approved by an administrator yet.",
      });
    }

    const validPassword = await bcrypt.compare(
      password,
      userWithRoles.password
    );
    if (!validPassword) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    if (!userWithRoles.roles) {
      return res.status(500).json({ error: "Could not fetch user roles." });
    }
    const userRoleNames = userWithRoles.roles.map((role) => role.name);

    const tokenPayload = {
      userId: userWithRoles.id,
      username: userWithRoles.username,
      name: userWithRoles.username,
      roles: userRoleNames,
      gender: userWithRoles.gender, // Diambil langsung dari User
      grade: userWithRoles.grade, // Diambil langsung dari User
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET!, {
      expiresIn: "8h",
    });

    res.json({
      message: "Login successful",
      token,
      user: tokenPayload, // Kirim data user yang sudah lengkap
    });
  }
}
