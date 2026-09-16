"use client";

import React, { useState, useEffect } from "react";
import { message, Spin } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  inputWrapperClasses,
  inputIconClasses,
  inputClasses,
  solidButtonClasses,
  authTitleClasses,
  authSubtitleClasses,
} from "./AuthStyles";

interface LoginFormProps {
  className: string;
  onSwitchMode: () => void;
  prefilledUsername?: string;
}

export default function LoginForm({
  className,
  onSwitchMode,
  prefilledUsername = "",
}: LoginFormProps) {
  const router = useRouter();
  const { login } = useAuth();

  const [loginUsername, setLoginUsername] = useState(prefilledUsername);
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  useEffect(() => {
    if (prefilledUsername) {
      setLoginUsername(prefilledUsername);
    }
  }, [prefilledUsername]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!loginUsername || !loginPassword) {
      setLoginError("Please enter both username and password.");
      return;
    }

    setLoginLoading(true);
    try {
      const success = await login(loginUsername, loginPassword);
      if (success) {
        message.success("Signed in successfully!");
        router.push("/dashboard");
      } else {
        setLoginError("Invalid credentials. Please try again.");
      }
    } catch {
      setLoginError("An unexpected error occurred. Please try again.");
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <form className={className} onSubmit={handleLoginSubmit}>
      <h2 className={authTitleClasses}>Welcome Back</h2>
      <p className={authSubtitleClasses}>Sign in to access your ATeens Dashboard</p>

      {loginError && (
        <div className="w-full max-w-[380px] p-2.5 mb-3 text-xs bg-red-50 border border-red-200 text-red-600 rounded-xl text-center">
          {loginError}
        </div>
      )}

      <div className={inputWrapperClasses}>
        <UserOutlined className={inputIconClasses} />
        <input
          type="text"
          placeholder="Username"
          value={loginUsername}
          onChange={(e) => setLoginUsername(e.target.value)}
          autoComplete="username"
          required
          className={inputClasses}
        />
      </div>

      <div className={inputWrapperClasses}>
        <LockOutlined className={inputIconClasses} />
        <input
          type="password"
          placeholder="Password"
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
          autoComplete="current-password"
          required
          className={inputClasses}
        />
      </div>

      <button
        type="submit"
        disabled={loginLoading}
        className={solidButtonClasses}
      >
        {loginLoading ? (
          <>
            <Spin size="small" />
            <span>Signing in...</span>
          </>
        ) : (
          "Sign In"
        )}
      </button>

      <div className="mt-4 text-xs text-gray-500 lg:hidden">
        Don&apos;t have an account?{" "}
        <button
          type="button"
          onClick={onSwitchMode}
          className="text-indigo-600 font-semibold underline hover:text-indigo-800 transition-colors"
        >
          Sign up
        </button>
      </div>
    </form>
  );
}
