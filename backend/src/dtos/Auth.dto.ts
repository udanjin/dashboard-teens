import { z } from "zod";

export const registerSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  dob: z.string().min(1),
  requestedRoles: z.array(z.string()).min(1),
  gender: z.string().optional(),
  grade: z.string().optional(),
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const approveUserSchema = z.object({
  roleIds: z.array(z.number()),
});
