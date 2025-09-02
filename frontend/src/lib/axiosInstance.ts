// lib/axiosInstance.ts
import axios from "axios";

// Create an Axios instance
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  }, // Your backend API URL
});

// --- Request Interceptor ---
// This runs BEFORE each request is sent
axiosInstance.interceptors.request.use(
  (config) => {
    // Check if we are on the client-side before accessing localStorage
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("authToken");
      if (token) {
        // If the token exists, add it to the Authorization header
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    // Do something with request error
    return Promise.reject(error);
  }
);

export default axiosInstance;
