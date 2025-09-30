"use client";

import { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/axiosInstance";
import { useRouter } from "next/navigation";
import { setToken, getToken, removeToken, decodeToken } from "@/lib/authUtils";
import { UserInfo } from "@/types";

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserInfo | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const token = getToken();
    if (token) {
      const decodedUser = decodeToken(token);
      if (decodedUser && decodedUser.exp * 1000 > Date.now()) {
        // FIX 1: Make sure to include the 'name' property here
        setUser({
          username: decodedUser.username,
          name: decodedUser.name || decodedUser.username,
          roles: decodedUser.roles,
        });
        setIsAuthenticated(true);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      } else {
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (username: string, password: string) => {
    setLoading(true);
    try {
      const response = await api.post("/users/login", {
        username,
        password,
      });

      const { token } = response.data;
      setToken(token);

      const decodedUser = decodeToken(token);
      if (decodedUser) {
        const currentUser: UserInfo = {
          // FIX 2: Access properties from the 'decodedUser' object, not the function
          username: decodedUser.username,
          name: decodedUser.name || decodedUser.username,
          roles: decodedUser.roles || [],
          grade: decodedUser.grade,
          gender: decodedUser.gender,
        };

        // FIX 3: You forgot to call setUser with the new user object
        setUser(currentUser);
        setIsAuthenticated(true);
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        return true;
      }
      return false;
    } catch (error) {
      console.error("Login error:", error);
      logout();
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    removeToken();
    delete api.defaults.headers.common["Authorization"];
    setIsAuthenticated(false);
    setUser(null);
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, user, login, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
