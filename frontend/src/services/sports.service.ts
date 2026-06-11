import axiosInstance from "@/lib/axiosInstance";
import type { SportReportApiResponse, SportReportPayload, SportEvent } from "@/types";

function mapApiResponseToEvent(item: SportReportApiResponse, index: number): SportEvent {
  return {
    key: item.id || String(index),
    id: item.id,
    date: item.date,
    code: item.code,
    participant: item.participant,
    venue: item.venue,
    category: item.sportsCategory,
    totalpemasukan: item.totalPemasukan,
    totalpengeluaran: item.totalPengeluaran,
    expenseDetails: (item.detailPengeluaran || []).map((d, i) => ({
      id: d.id || `${item.id}-expense-${i}`,
      keterangan: d.keterangan,
      cost: d.cost,
    })),
    pemasukanDetails: (item.detailPemasukan || []).map((d, i) => ({
      id: d.id || `${item.id}-income-${i}`,
      keterangan: d.keterangan,
      cost: d.cost,
    })),
  };
}

export const sportsService = {
  async getAll(): Promise<SportEvent[]> {
    const res = await axiosInstance.get<SportReportApiResponse[]>("/sport-reports");
    return res.data.map(mapApiResponseToEvent);
  },

  create(payload: SportReportPayload) {
    return axiosInstance.post("/sport-reports", payload);
  },

  update(id: string, payload: SportReportPayload) {
    return axiosInstance.put(`/sport-reports/${id}`, payload);
  },

  delete(id: string) {
    return axiosInstance.delete(`/sport-reports/${id}`);
  },

  getCashBalance() {
    return axiosInstance.get<number>("/sport-reports/cash-balance");
  },
};
