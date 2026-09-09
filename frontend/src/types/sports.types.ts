export type SportCode = "Anak" | "Pelayan";
export type SportCategory = "Basket" | "Futsal" | "Badminton" | "Football";

export interface FinancialDetail {
  id: string;
  keterangan: string;
  cost: number;
}

export interface SportEvent {
  key: string;
  id: string;
  code: SportCode;
  date: string;
  category: SportCategory;
  venue: string;
  participant: number;
  expenseDetails: FinancialDetail[];
  pemasukanDetails: FinancialDetail[];
  totalpengeluaran: number;
  totalpemasukan: number;
  creator?: { username: string };
}

export interface SportReportApiResponse {
  id: string;
  code: SportCode;
  date: string;
  sportsCategory: SportCategory;
  venue: string;
  participant: number;
  detailPengeluaran: { id?: string; keterangan: string; cost: number }[];
  detailPemasukan: { id?: string; keterangan: string; cost: number }[];
  totalPemasukan: number;
  totalPengeluaran: number;
}

export interface SportReportPayload {
  code: SportCode;
  date: string;
  sportsCategory: SportCategory;
  venue: string;
  participant: number;
  detailPengeluaran: { keterangan: string; cost: number }[];
  detailPemasukan: { keterangan: string; cost: number }[];
  totalPemasukan: number;
  totalPengeluaran: number;
}

export const CODE_OPTIONS = [
  { value: "A" as const, label: "Anak" },
  { value: "P" as const, label: "Pelayan" },
];

export const CATEGORY_OPTIONS = [
  { value: "Basket" as const, label: "Basket" },
  { value: "Futsal" as const, label: "Futsal" },
  { value: "Badminton" as const, label: "Badminton" },
  { value: "Football" as const, label: "Football" },
];

export interface SportReportKpis {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  totalParticipants: number;
  totalEvents: number;
}

export interface SportReportApiResponseWrapper {
  data: SportReportApiResponse[];
  kpis: SportReportKpis;
}
