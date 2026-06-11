import axiosInstance from "@/lib/axiosInstance";
import type {
  Member,
  LeaderSummary,
  WeeklyStatsResponse,
  Birthday,
  DeletionRequest,
  AddMemberData,
} from "@/types";

export const fclService = {
  getMyMembers() {
    return axiosInstance.get<Member[]>("/fcl/my-members");
  },

  addMembers(membersData: AddMemberData[]) {
    return axiosInstance.post("/fcl/members", { membersData });
  },

  requestDeleteMember(memberId: number, reason: string) {
    return axiosInstance.put(`/fcl/request-delete/${memberId}`, { reason });
  },

  getSummary(month: number, year: number) {
    return axiosInstance.get<LeaderSummary[]>(
      `/fcl/fcl-summary?month=${month}&year=${year}`
    );
  },

  getWeeklyStats(params: {
    month: number;
    year: number;
    gender?: string | null;
    grade?: number | null;
    leaderName?: string | null;
  }) {
    const searchParams = new URLSearchParams({
      month: String(params.month),
      year: String(params.year),
    });
    if (params.gender) searchParams.append("gender", params.gender);
    if (params.grade) searchParams.append("grade", String(params.grade));
    if (params.leaderName) searchParams.append("leaderName", params.leaderName);

    return axiosInstance.get<WeeklyStatsResponse>(
      `/fcl/weekly-stats?${searchParams.toString()}`
    );
  },

  getBirthdays() {
    return axiosInstance.get<Birthday[]>("/fcl/birthdays");
  },

  getDeletionRequests() {
    return axiosInstance.get<DeletionRequest[]>("/fcl/deletion-request");
  },

  approveDeletion(memberId: number) {
    return axiosInstance.delete(`/fcl/approve-deletion/${memberId}`);
  },

  rejectDeletion(memberId: number) {
    return axiosInstance.put(`/fcl/reject-deletion/${memberId}`);
  },
};
