import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  dob: z.string().nullable().optional(),
});

export const updateUserSchema = z.object({
  roleIds: z.array(z.number()).optional(),
  fcId: z.number().nullable().optional(),
  gender: z.string().optional(),
});
