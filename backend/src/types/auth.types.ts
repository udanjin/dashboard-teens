import { Request } from "express";
import type { Permission } from "./permissions";

export interface JwtPayload {
  userId: number;
  username: string;
  name: string;
  roles: string[];
  permissions: Permission[];
  gender?: string;
  grade?: number;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface LoginRequestBody {
  username: string;
  password: string;
}

export interface RegisterRequestBody {
  username: string;
  password: string;
  dob: string;
  accountType: "member" | "leader";
  gender?: string;
  grade?: number;
}

export interface UserResponse {
  id: number;
  username: string;
  name: string;
  roles: string[];
  permissions: Permission[];
  gender?: string;
  grade?: number;
}
