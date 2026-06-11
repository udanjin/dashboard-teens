import axiosInstance from "@/lib/axiosInstance";
import type { AttendanceSheetEntry, AttendancePayload, SingleAttendanceStats } from "@/types";

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
};
