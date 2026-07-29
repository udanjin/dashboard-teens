import axios from "axios";
import { clearStoredUser } from "./authUtils";

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
    if (error.response?.status === 401 && typeof window !== "undefined" && !isPublicRoute()) {
      clearStoredUser();
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default axiosInstance;
