import { z } from "zod";

export const getSheetSchema = z.object({
  query: z.object({
    date: z.string().min(1, "Date is required"),
  }),
});

export const submitAttendanceSchema = z.object({
  body: z.object({
    date: z.string().min(1, "Date is required"),
    attendances: z.array(
      z.object({
        memberId: z.number(),
        status: z.number().nullable(),
      })
    ),
  }),
});

export const getSingleAttendanceSchema = z.object({
  query: z.object({
    month: z.string().min(1, "Month is required"),
    year: z.string().min(1, "Year is required"),
  }),
});
