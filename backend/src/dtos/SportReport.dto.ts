import { z } from "zod";

export const getSportReportsSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  category: z.string().optional(),
  code: z.string().optional(),
  search: z.string().optional(),
});

export const createSportReportSchema = z.object({
  date: z.string(),
  sportsCategory: z.string(),
  venue: z.string(),
  code: z.string(),
  participant: z.number(),
  detailPengeluaran: z.array(z.object({ keterangan: z.string(), cost: z.number() })),
  detailPemasukan: z.array(z.object({ keterangan: z.string(), cost: z.number() })),
  totalPengeluaran: z.number(),
  totalPemasukan: z.number(),
});

export const updateSportReportSchema = createSportReportSchema.partial();
