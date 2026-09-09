import axiosInstance from "@/lib/axiosInstance";
import type { SportReportApiResponse, SportReportPayload, SportEvent, SportReportKpis, SportReportApiResponseWrapper } from "@/types";

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
    creator: item.creator,
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
  async getAll(params?: Record<string, any>): Promise<{ data: SportEvent[], kpis: SportReportKpis }> {
    const res = await axiosInstance.get<SportReportApiResponseWrapper>("/sport-reports", { params });
    return {
      data: res.data.data.map(mapApiResponseToEvent),
      kpis: res.data.kpis
    };
  },

  getVenues() {
    return axiosInstance.get<string[]>("/sport-reports/venues").then((res) => res.data);
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
