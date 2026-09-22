import axiosInstance from "@/lib/axiosInstance";
import type { AttendanceSheetEntry, AttendancePayload, SingleAttendanceStats } from "@/types";

export interface AttendanceHistoryEntry {
  id: number;
  memberId: number;
  date: string;
  updatedBy: number;
  action: "Created" | "Updated" | "Deleted";
  oldStatus: number | null;
  newStatus: number | null;
  createdAt: string;
  Updater?: {
    id: number;
    username: string;
    name: string | null;
  };
}

export const attendanceService = {
  getSingleAttendance(month: number, year: number) {
    return axiosInstance.get<SingleAttendanceStats>(
      `/attendance/single-attendance?month=${month}&year=${year}`
    );
  },

  getSheet(date: string) {
    return axiosInstance.get<AttendanceSheetEntry[]>(
      `/attendance/sheet?date=${date}`
    );
  },

  submit(payload: AttendancePayload) {
    return axiosInstance.post("/attendance", payload);
  },

  getHistory(memberId: number, date: string) {
    return axiosInstance.get<AttendanceHistoryEntry[]>(
      `/attendance/history/${memberId}/${date}`
    );
  },

  getHistoryByMonth(memberId: number, month: number, year: number) {
    return axiosInstance.get<AttendanceHistoryEntry[]>(
      `/attendance/history/monthly/${memberId}?month=${month}&year=${year}`
    );
  },
};
