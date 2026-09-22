import axios from "axios";
import { clearStoredUser } from "./authUtils";
import { message } from "antd";

const axiosInstance = axios.create({
  // Use the Next.js rewrite proxy (/api/* → Cloud Run) instead of calling
  // Cloud Run directly. This makes all requests same-origin from the browser's
  // perspective, which fixes cookie handling on Safari iOS (ITP).
  baseURL: "/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const PUBLIC_PATHS = ["/login", "/register"];

function isPublicRoute(): boolean {
  const path = window.location.pathname;
  return path === "/" || PUBLIC_PATHS.some((p) => path.startsWith(p));
}

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== "undefined") {
      if (error.response?.status === 401 && !isPublicRoute()) {
        clearStoredUser();
        window.location.href = "/login";
      } else if (error.response?.data?.error) {
        // Automatically show error toast for standard API errors
        message.error(error.response.data.error);
      } else if (error.message && error.message !== "Network Error" && error.response?.status !== 401) {
        message.error("An unexpected error occurred. Please try again.");
      }
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
