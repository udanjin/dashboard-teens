"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// FIXED: Use the login method from AuthContext instead of @/lib/auth
import { useAuth } from "@/context/AuthContext"; // Adjust path as needed

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth(); // Use the login method from AuthContext
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Check if the fields are empty before making an API call
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);

    try {
      // FIXED: Use the login method from AuthContext which returns a boolean
      const success = await login(username, password);
      
      if (success) {
        // On success, redirect the user to their dashboard
        router.push("/dashboard");
      } else {
        // If login returns false, show a generic error
        setError("Login failed. Please check your credentials.");
      }
    } catch (err: any) {
      // Handle any unexpected errors
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.request) {
        errorMessage = "Cannot connect to the server. Please check your connection.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      console.error("Login failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4">
      <div className="w-full max-w-md">
        {/* Login Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Decorative Header */}
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-center">
            <h1 className="text-2xl font-bold text-white">Welcome Back!</h1>
            <p className="text-indigo-100 mt-1">
              Sign in to your ATeens Dashboard
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="e.g., admin"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="••••••••"
                required
              />
            </div>

            {/* Display error message directly in the UI */}
            {error && (
              <div
                className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative text-center"
                role="alert"
              >
                <span className="block sm:inline">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-full shadow-sm text-white font-medium bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}