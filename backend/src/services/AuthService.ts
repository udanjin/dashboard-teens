import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, Role } from "../models";
import { getPermissionsForRoles } from "../types";
import type { RegisterRequestBody, LoginRequestBody, UserResponse } from "../types";

const TOKEN_EXPIRY = "8h";

export class AuthService {
  static async registerUser(data: RegisterRequestBody) {
    const existing = await User.findOne({ where: { username: data.username } });
    if (existing) {
      throw new Error("Username is already taken");
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await User.create({
      username: data.username,
      password: hashedPassword,
      status: "pending",
      gender: data.gender,
      grade: data.grade,
      dob: data.dob,
    });

    return user;
  }

  static async loginUser(data: LoginRequestBody): Promise<{ token: string; user: UserResponse }> {
    const user = await User.findOne({
      where: { username: data.username },
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
      throw new Error("Invalid username or password");
    }

    if (user.status !== "approved") {
      throw new Error("Your account has not been approved yet.");
    }

    const validPassword = await bcrypt.compare(data.password, user.password);
    if (!validPassword) {
      throw new Error("Invalid username or password");
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

    const userResponse: UserResponse = {
      id: user.id,
      username: user.username,
      name: user.username,
      roles: roleNames,
      permissions,
      gender: user.gender,
      grade: user.grade,
    };

    return { token, user: userResponse };
  }

  static async approveUser(userId: number, roleIds: number[]) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    user.status = "approved";
    await user.save();
    await (user as any).setRoles(roleIds);

    return user;
  }

  static async rejectUser(userId: number) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.status !== "pending") {
      throw new Error("User is not in a pending state.");
    }

    const username = user.username;
    await user.destroy();
    
    return username;
  }

  static async getPendingUsers() {
    return User.findAll({
      where: { status: "pending" },
      attributes: ["id", "username", "status", "createdAt"],
    });
  }
}
