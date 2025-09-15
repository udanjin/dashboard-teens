// services/auth.ts
import axiosInstance from "./axiosInstance";

/**
 * Logs in the user and stores the auth token.
 */
export async function login(username: string, password: string): Promise<void> {
  try {
    const response = await axiosInstance.post("users/login", {
      username,
      password,
    },{ 
        withCredentials: true // ← EXPLICITLY enable credentials for this request
      });

    const { token } = response.data;

    if (token) {
      // Store the token in localStorage
      localStorage.setItem("authToken", token);
      
      // Set the default Authorization header for subsequent requests
      axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    }
  } catch (error) {
    console.error("Login failed:", error);
    // Re-throw the error so the UI component can handle it
    throw error;
  }
}

/**
 * Logs out the user by removing the token.
 */
export function logout(): void {
  // Remove the token from localStorage
  localStorage.removeItem("authToken");
  
  // Remove the Authorization header from the Axios instance
  delete axiosInstance.defaults.headers.common["Authorization"];
}

/**
 * Checks if the user is authenticated.
 * Essential for Next.js to avoid SSR errors.
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") {
    // During server-side rendering, always return false
    return false;
  }
  return !!localStorage.getItem("authToken");
}