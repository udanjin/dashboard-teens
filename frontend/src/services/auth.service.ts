import axiosInstance from "@/lib/axiosInstance";
import type { LoginResponse, RegisterRequest, UserInfo } from "@/types";

export const authService = {
  login(username: string, password: string) {
    return axiosInstance.post<LoginResponse>("/auth/login", { username, password });
  },

  logout() {
    return axiosInstance.post("/auth/logout");
  },

  getMe() {
    return axiosInstance.get<UserInfo>("/auth/me");
  },

  register(data: RegisterRequest) {
    return axiosInstance.post("/auth/register", data);
  },
};
