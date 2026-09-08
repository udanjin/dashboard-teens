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
