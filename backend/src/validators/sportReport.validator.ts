import { z } from "zod";

export const sportReportSchema = z.object({
  body: z.object({
    date: z.string().optional(),
    description: z.string().optional(),
    totalPemasukan: z.number().optional(),
    totalPengeluaran: z.number().optional(),
  }),
});

export const updateSportReportSchema = z.object({
  params: z.object({
    id: z.string(),
  }),
  body: z.object({
    date: z.string().optional(),
    description: z.string().optional(),
    totalPemasukan: z.number().optional(),
    totalPengeluaran: z.number().optional(),
  }),
});
