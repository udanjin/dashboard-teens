import { z } from "zod";

export const createCashAdjustmentSchema = z.object({
  type: z.enum(["increase", "decrease"]),
  amount: z.number().positive("Amount must be positive"),
  reason: z.string().min(1, "A reason is required"),
  effectiveDate: z.string(),
});

export const getCashAdjustmentsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
