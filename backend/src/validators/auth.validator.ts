import { z } from "zod";

export const registerSchema = z.object({
  body: z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    dob: z.string().min(1, "Date of birth is required"),
    accountType: z.string().min(1, "Account type is required"),
    gender: z.string().optional(),
    grade: z.union([z.string(), z.number()]).optional(),
  }).refine((data) => {
    if (data.accountType === "leader") {
      return !!data.gender && !!data.grade;
    }
    return true;
  }, {
    message: "Gender and grade are required for leader accounts",
    path: ["accountType"],
  }),
});

export const loginSchema = z.object({
  body: z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const approveUserSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    roleIds: z.array(z.number()).min(1, "At least one role must be selected"),
  }),
});
