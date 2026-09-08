import axiosInstance from "@/lib/axiosInstance";
import type { PendingUser, Role, ApproveUserPayload, ApprovedUser, UpdateUserPayload } from "@/types";

export const userService = {
  getPendingUsers() {
    return axiosInstance.get<PendingUser[]>("/auth/pending");
  },

  getRoles() {
    return axiosInstance.get<Role[]>("/auth/roles");
  },

  approveUser(userId: string, payload: ApproveUserPayload) {
    return axiosInstance.put(`/auth/approve/${userId}`, payload);
  },

  rejectUser(userId: string) {
    return axiosInstance.delete(`/auth/reject/${userId}`);
  },

  getApprovedUsers() {
    return axiosInstance.get<ApprovedUser[]>("/users");
  },

  updateUser(userId: string, payload: UpdateUserPayload) {
    return axiosInstance.put(`/users/${userId}`, payload);
  },

  deleteUser(userId: string) {
    return axiosInstance.delete(`/users/${userId}`);
  },
};
