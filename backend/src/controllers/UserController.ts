import { Controller, Get, Put, Delete, Middleware } from "@overnightjs/core";
import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import jwt from "jsonwebtoken";
import { User, Role } from "../models";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/roleAuth";
import { PERMISSIONS } from "../types";
import { NotFoundError } from "../errors/AppError";
import { setCookieToken } from "../utils/cookie";
import { updateProfileSchema, updateUserSchema } from "../dtos/User.dto";

@Controller("api/users")
export class UserController {
  @Put("profile")
  @Middleware([authMiddleware])
  public async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { name, dob } = updateProfileSchema.parse(req.body);

      const user = await User.findByPk(userId);
      if (!user) throw new NotFoundError("User not found");

      if (name !== undefined) user.name = name;
      if (dob !== undefined) user.dob = dob as any;

      await user.save();

      const { iat, exp, ...restUser } = req.user! as any;
      const updatedUserPayload = {
        ...restUser,
        name: user.name || user.username,
        dob: user.dob,
      };

      const token = jwt.sign(updatedUserPayload, process.env.JWT_SECRET!, {
        expiresIn: "8h",
      });

      setCookieToken(res, token);

      res.json({ message: "Profile updated successfully", user: updatedUserPayload });
    } catch (error) {
      next(error);
    }
  }

  @Get("")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.APPROVAL_VIEW)])
  public async getApprovedUsers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await User.findAll({
        where: { status: "approved" },
        attributes: ["id", "username", "status", "createdAt", "gender", "requestedRoles", "fcId"],
        include: [
          {
            model: Role,
            as: "roles",
            attributes: ["id", "name"],
            through: { attributes: [] },
          },
          {
            model: require("../models/FamilyCell").default,
            as: "familyCell",
            attributes: ["id", "name", "grade"],
          }
        ],
        order: [["createdAt", "DESC"]],
      });

      res.json(users);
    } catch (error) {
      next(error);
    }
  }

  @Put(":id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.APPROVAL_MANAGE)])
  public async updateUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = Number(req.params.id);
      const { roleIds, fcId, gender } = updateUserSchema.parse(req.body);

      const user = await User.findByPk(userId);
      if (!user) throw new NotFoundError("User not found");

      if (fcId !== undefined) user.fcId = fcId;
      if (gender !== undefined) user.gender = gender as "Male" | "Female";

      await user.save();

      if (roleIds && Array.isArray(roleIds)) {
        // Sequelize setRoles replaces existing associations
        await (user as any).setRoles(roleIds);
      }

      res.json({ message: "User updated successfully" });
    } catch (error) {
      next(error);
    }
  }

  @Delete(":id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.APPROVAL_MANAGE)])
  public async deleteUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = Number(req.params.id);

      const user = await User.findByPk(userId);
      if (!user) throw new NotFoundError("User not found");

      await user.destroy();

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      next(error);
    }
  }
}
