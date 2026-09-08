import { z } from "zod";

export const addMembersSchema = z.object({
  membersData: z.array(z.object({
    name: z.string(),
    grade: z.union([z.string(), z.number()]),
    gender: z.string(),
    dob: z.string(),
    phoneNumber: z.string().optional().nullable(),
  })),
});

export const editMemberSchema = z.object({
  name: z.string().optional(),
  dob: z.string().optional(),
  phoneNumber: z.string().optional().nullable(),
});

export const fclSummarySchema = z.object({
  month: z.string().optional(),
  year: z.string().optional(),
});

export const weeklyStatsSchema = z.object({
  month: z.string().optional(),
  year: z.string().optional(),
  gender: z.string().optional(),
  grade: z.string().optional(),
});

export const requestDeleteSchema = z.object({
  reason: z.string().min(1, "A reason for deletion is required"),
});
