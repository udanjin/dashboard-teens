import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, Role } from "../models";
import { registerSchema, loginSchema } from "../dtos/Auth.dto";
import { z } from "zod";
import { getPermissionsForRoles } from "../types";
import { BadRequestError, NotFoundError, ForbiddenError, UnauthorizedError } from "../errors/AppError";

const TOKEN_EXPIRY = "8h";

export class AuthService {
  static async register(data: z.infer<typeof registerSchema>) {
    if (data.requestedRoles.includes("leader") && (!data.gender || !data.grade)) {
      throw new BadRequestError("Gender and grade are required when requesting the leader role");
    }

    const existing = await User.findOne({ where: { username: data.username } });
    if (existing) {
      throw new BadRequestError("Username is already taken");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    return await User.create({
      username: data.username,
      password: hashedPassword,
      status: "pending",
      gender: data.gender,
      dob: data.dob,
      name: data.name || null,
      requestedRoles: {
        roles: data.requestedRoles,
        requestedGrade: data.grade,
      },
    });
  }

  static async login(data: z.infer<typeof loginSchema>) {
    const user = await User.findOne({
      where: { username: data.username },
      include: [
        {
          model: Role,
          as: "roles",
          attributes: ["name"],
          through: { attributes: [] },
        },
        {
          model: require("../models/FamilyCell").default,
          as: "familyCell",
          attributes: ["grade", "name"],
        }
      ],
    });

    if (!user) throw new UnauthorizedError("Invalid username or password");

    if (user.status !== "approved") {
      throw new ForbiddenError("Your account has not been approved yet.");
    }

    const validPassword = await bcrypt.compare(data.password, user.password);
    if (!validPassword) {
      throw new UnauthorizedError("Invalid username or password");
    }

    const roleNames = user.roles?.map((r: any) => r.name) ?? [];
    const permissions = getPermissionsForRoles(roleNames);

    const payload = {
      userId: user.id,
      username: user.username,
      name: user.name || user.username,
      dob: user.dob,
      roles: roleNames,
      permissions,
      gender: user.gender,
      grade: (user as any).familyCell?.grade || null,
      fcId: user.fcId,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: TOKEN_EXPIRY,
    });

    const userResponse = {
      id: user.id,
      username: user.username,
      name: user.name || user.username,
      dob: user.dob,
      roles: roleNames,
      permissions,
      gender: user.gender,
      grade: (user as any).familyCell?.grade || null,
      fcId: user.fcId,
    };

    return { token, user: userResponse };
  }

  static async getPendingUsers() {
    return await User.findAll({
      where: { status: "pending" },
      attributes: ["id", "username", "status", "createdAt", "requestedRoles", "gender"],
    });
  }

  static async getAllRoles() {
    return await Role.findAll({ attributes: ["id", "name"] });
  }

  static async approveUser(id: number, data: { roleIds: number[], fcId?: number, createFc?: boolean, fcGrade?: number }) {
    const user = await User.findByPk(id);
    if (!user) throw new NotFoundError("User not found");

    if (data.createFc && data.fcGrade !== undefined) {
      const FamilyCell = require("../models/FamilyCell").default;
      const fcName = `Grade ${data.fcGrade} (${user.username}'s Group)`;
      const fc = await FamilyCell.create({ name: fcName, grade: data.fcGrade });
      user.fcId = fc.id;
    } else if (data.fcId) {
      user.fcId = data.fcId;
    }

    user.status = "approved";
    await user.save();
    await (user as any).setRoles(data.roleIds);

    return user;
  }

  static async rejectUser(id: number) {
    const user = await User.findByPk(id);
    if (!user) throw new NotFoundError("User not found");

    if (user.status !== "pending") {
      throw new BadRequestError("User is not in a pending state.");
    }

    const username = user.username;
    await user.destroy();
    return username;
  }
}
