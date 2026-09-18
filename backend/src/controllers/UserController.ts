import { Controller, Get, Put, Delete, Middleware } from "@overnightjs/core";
import { Request, Response } from "express";
import { User, Role } from "../models";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/roleAuth";
import { PERMISSIONS } from "../types";
import { NotFoundError } from "../errors/AppError";

@Controller("api/users")
export class UserController {
  @Put("profile")
  @Middleware([authMiddleware])
  public async updateProfile(req: Request, res: Response): Promise<void> {
    const userId = (req as any).user.userId;
    const { name, dob } = req.body;

    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError("User not found");

    if (name !== undefined) user.name = name;
    if (dob !== undefined) user.dob = dob;

    await user.save();

    res.json({ message: "Profile updated successfully" });
  }

  @Get("")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.APPROVAL_VIEW)])
  public async getApprovedUsers(req: Request, res: Response): Promise<void> {
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
  }

  @Put(":id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.APPROVAL_MANAGE)])
  public async updateUser(req: Request, res: Response): Promise<void> {
    const userId = Number(req.params.id);
    const { roleIds, fcId, gender } = req.body;

    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError("User not found");

    if (fcId !== undefined) user.fcId = fcId;
    if (gender !== undefined) user.gender = gender;

    await user.save();

    if (roleIds && Array.isArray(roleIds)) {
      // Sequelize setRoles replaces existing associations
      await (user as any).setRoles(roleIds);
    }

    res.json({ message: "User updated successfully" });
  }

  @Delete(":id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.APPROVAL_MANAGE)])
  public async deleteUser(req: Request, res: Response): Promise<void> {
    const userId = Number(req.params.id);

    const user = await User.findByPk(userId);
    if (!user) throw new NotFoundError("User not found");

    await user.destroy();

    res.json({ message: "User deleted successfully" });
  }
}
