import * as bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, Role } from "../models";
import { getPermissionsForRoles } from "../types";
import { BadRequestError, NotFoundError, ForbiddenError, UnauthorizedError } from "../errors/AppError";

const TOKEN_EXPIRY = "8h";

export class AuthService {
  static async register(data: any) {
    if (data.accountType === "leader" && (!data.gender || !data.grade)) {
      throw new BadRequestError("Gender and grade are required for leader accounts");
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
      grade: data.grade,
      dob: data.dob,
    });
  }

  static async login(data: any) {
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
      name: user.username,
      roles: roleNames,
      permissions,
      gender: user.gender,
      grade: user.grade,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: TOKEN_EXPIRY,
    });

    const userResponse = {
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

  static async getPendingUsers() {
    return await User.findAll({
      where: { status: "pending" },
      attributes: ["id", "username", "status", "createdAt"],
    });
  }

  static async getAllRoles() {
    return await Role.findAll({ attributes: ["id", "name"] });
  }

  static async approveUser(id: number, roleIds: number[]) {
    const user = await User.findByPk(id);
    if (!user) throw new NotFoundError("User not found");

    user.status = "approved";
    await user.save();
    await (user as any).setRoles(roleIds);

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
