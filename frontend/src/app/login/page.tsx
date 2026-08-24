"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { ArrowRightOutlined, LoadingOutlined } from "@ant-design/icons";
import ThemeToggle from "@/components/Common/ThemeToggle";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    try {
      const success = await login(username, password);
      if (success) {
        router.push("/dashboard");
      } else {
        setError("Login failed. Please check your credentials.");
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string; message?: string } }; request?: unknown; message?: string };
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.request) {
        setError("Cannot connect to the server. Please check your connection.");
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-transparent p-4 relative z-10">
      {/* Theme Toggle at top right */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>
      
      {/* Outer Shell (Double-Bezel Architecture) */}
      <div className="w-full max-w-md p-2 rounded-[2rem] bg-white/40 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 shadow-2xl backdrop-blur-2xl">
        {/* Inner Core */}
        <div className="bg-white dark:bg-[#0A0A0A] rounded-[calc(2rem-0.5rem)] overflow-hidden shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
          
          <div className="p-10 pb-6 text-center">
            <div className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70 mb-4">
              Authentication
            </div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-[rgba(255,255,255,0.95)] tracking-tight">Welcome Back</h1>
            <p className="text-gray-500 dark:text-[rgba(255,255,255,0.45)] mt-2 text-sm">Sign in to your ATeens Dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="p-10 pt-4 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-[13px] font-medium text-gray-700 dark:text-[rgba(255,255,255,0.7)] mb-1.5 ml-1">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 h-12 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-white/30 focus:border-primary dark:focus:border-white/30 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  placeholder="e.g., admin"
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-[13px] font-medium text-gray-700 dark:text-[rgba(255,255,255,0.7)] mb-1.5 ml-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 h-12 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-primary dark:focus:ring-white/30 focus:border-primary dark:focus:border-white/30 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-500/30 text-red-600 dark:text-red-200 px-4 py-3 rounded-xl text-center text-sm backdrop-blur-md" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="group w-full flex items-center justify-between pl-6 pr-2 h-14 rounded-full text-white dark:text-[#050505] font-medium bg-[#7C3AED] dark:bg-[#FAFAFA] hover:bg-[#6D28D9] dark:hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0A0A0A] focus:ring-[#7C3AED] dark:focus:ring-white transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              <span className="flex-1 text-center pr-2">
                {loading ? "Signing in..." : "Sign in"}
              </span>
              
              {/* Nested Button-in-Button Trailing Icon */}
              <div className="w-10 h-10 rounded-full bg-black/10 dark:bg-black/10 flex items-center justify-center transition-transform duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] group-hover:translate-x-1 group-hover:scale-105 shrink-0 text-white dark:text-black">
                {loading ? (
                  <LoadingOutlined className="text-lg" />
                ) : (
                  <ArrowRightOutlined className="text-lg" />
                )}
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
