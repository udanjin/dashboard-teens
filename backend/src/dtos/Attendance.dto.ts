import { z } from "zod";

export const getAttendanceSheetSchema = z.object({
  date: z.string(),
});

export const submitAttendanceSchema = z.object({
  date: z.string(),
  attendances: z.array(
    z.object({
      memberId: z.number(),
      status: z.number().nullable(),
    })
  ),
});

export const getSingleAttendanceSchema = z.object({
  month: z.string(),
  year: z.string(),
});

export const getMonthlyHistorySchema = z.object({
  month: z.coerce.number().min(1).max(12),
  year: z.coerce.number().min(2000).max(2100)
});
