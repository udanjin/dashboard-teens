"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DatePicker, Select, message, Spin } from "antd";
import {
  UserOutlined,
  LockOutlined,
  CalendarOutlined,
  TeamOutlined,
  WomanOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth.service";
import type { RegisterRequest } from "@/types";

const MINISTRY_ROLES = [
  { value: "leader", label: "Cell Group Leader" },
  { value: "fcl", label: "FCL Coordinator" },
  { value: "sports", label: "Sports Team" },
  { value: "admin", label: "Admin" },
];

const GRADE_OPTIONS = [7, 8, 9, 10, 11, 12].map((g) => ({
  value: g,
  label: `Grade ${g}`,
}));

const GENDER_OPTIONS = [
  { value: "Laki-laki", label: "Male" },
  { value: "Perempuan", label: "Female" },
];

interface AuthSwitchProps {
  initialMode?: "signin" | "signup";
}

export default function AuthSwitch({ initialMode = "signin" }: AuthSwitchProps) {
  const router = useRouter();
  const { login } = useAuth();

  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");

  // Sign In State
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);

  // Sign Up State
  const [regRoles, setRegRoles] = useState<string[]>([]);
  const [regUsername, setRegUsername] = useState("");
  const [regDob, setRegDob] = useState<Dayjs | null>(null);
  const [regGender, setRegGender] = useState<string | undefined>(undefined);
  const [regGrade, setRegGrade] = useState<number | undefined>(undefined);
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState<string | null>(null);
  const [regSuccess, setRegSuccess] = useState<string | null>(null);

  useEffect(() => {
    setIsSignUp(initialMode === "signup");
  }, [initialMode]);

  const handleModeChange = (signUp: boolean) => {
    setIsSignUp(signUp);
    setLoginError(null);
    setRegError(null);
    // Sync browser URL without full reload
    const targetUrl = signUp ? "/register" : "/login";
    window.history.pushState(null, "", targetUrl);
  };

  // Handle Login Submit
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

  // Handle Register Submit
  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    if (!regRoles.length) {
      setRegError("Please select at least one ministry role.");
      return;
    }
    if (!regUsername || regUsername.length < 4) {
      setRegError("Username must be at least 4 characters long.");
      return;
    }
    if (!regDob) {
      setRegError("Please select your date of birth.");
      return;
    }
    if (regRoles.includes("leader")) {
      if (!regGender) {
        setRegError("Gender is required for Leaders.");
        return;
      }
      if (!regGrade) {
        setRegError("Grade is required for Leaders.");
        return;
      }
    }
    if (!regPassword || regPassword.length < 6) {
      setRegError("Password must be at least 6 characters long.");
      return;
    }
    if (regPassword !== regConfirm) {
      setRegError("Passwords do not match!");
      return;
    }

    setRegLoading(true);
    try {
      const payload: RegisterRequest = {
        requestedRoles: regRoles,
        username: regUsername,
        password: regPassword,
        dob: regDob ? regDob.format("YYYY-MM-DD") : null,
        ...(regRoles.includes("leader") && {
          gender: regGender,
          grade: regGrade,
        }),
      };

      await authService.register(payload);
      setRegSuccess(
        "Registration successful! Your account is now pending approval."
      );
      message.success(
        "Registration successful! Your account is now pending approval."
      );

      // Auto switch back to sign-in after 2.5 seconds
      setTimeout(() => {
        handleModeChange(false);
        setLoginUsername(regUsername);
        setRegSuccess(null);
      }, 2500);
    } catch (err: unknown) {
      const error = err as {
        response?: { data?: { error?: string; message?: string } };
      };
      setRegError(
        error.response?.data?.error ||
          error.response?.data?.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setRegLoading(false);
    }
  };

  const isLeaderSelected = regRoles.includes("leader");

  // Tailwind Class Constants
  const wrapperClasses = "min-h-screen w-full flex justify-center items-center bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-5 font-sans overflow-hidden";
  const cardClasses = "relative w-full max-w-[1050px] min-h-[820px] lg:min-h-[640px] bg-white rounded-3xl shadow-2xl overflow-hidden";
  
  const backgroundCircleClasses = `
    absolute rounded-full z-10 bg-gradient-to-tl from-sky-600 via-indigo-600 to-blue-600
    transition-all duration-[2000ms] lg:duration-[1800ms] ease-in-out
    w-[1500px] h-[1500px] lg:w-[2200px] lg:h-[2200px]
    left-[30%] lg:left-auto lg:top-[-10%]
    ${isSignUp 
      ? "bottom-[32%] -translate-x-1/2 translate-y-full lg:bottom-auto lg:right-[52%] lg:translate-x-full lg:-translate-y-1/2" 
      : "bottom-[68%] -translate-x-1/2 translate-y-0 lg:bottom-auto lg:right-[48%] lg:translate-x-0 lg:-translate-y-1/2"
    }
  `;

  const formsContainerClasses = "absolute w-full h-full top-0 left-0";
  
  const signinSignupContainerClasses = `
    absolute grid grid-cols-1 z-[5] transition-all duration-1000 delay-[800ms] lg:delay-[700ms] ease-in-out w-full lg:w-1/2
    ${isSignUp
      ? "top-[5%] left-1/2 -translate-x-1/2 translate-y-0 lg:top-1/2 lg:left-[25%] lg:-translate-x-1/2 lg:-translate-y-1/2"
      : "top-[95%] left-1/2 -translate-x-1/2 -translate-y-full lg:top-1/2 lg:left-[75%] lg:-translate-x-1/2 lg:-translate-y-1/2"
    }
  `;

  const formBaseClasses = "flex items-center justify-center flex-col px-6 lg:px-12 py-6 transition-all duration-200 delay-[800ms] lg:delay-[700ms] overflow-hidden col-start-1 row-start-1 w-full";
  
  const signInFormClasses = `${formBaseClasses} ${isSignUp ? "opacity-0 z-[1] pointer-events-none" : "opacity-100 z-[2] pointer-events-auto"}`;
  const signUpFormClasses = `${formBaseClasses} max-h-[580px] overflow-y-auto ${isSignUp ? "opacity-100 z-[2] pointer-events-auto" : "opacity-0 z-[1] pointer-events-none"}`;

  const authTitleClasses = "text-[2rem] text-[#2d3748] mb-1.5 font-bold tracking-tight";
  const authSubtitleClasses = "text-[0.875rem] text-[#718096] mb-5 text-center";

  const inputWrapperClasses = `
    w-full max-w-[380px] bg-[#f3f4f6] my-[7px] h-12 rounded-full flex items-center px-4 relative transition-all duration-300 border border-transparent 
    focus-within:bg-white focus-within:border-indigo-500 focus-within:shadow-[0_0_0_3px_rgba(99,102,241,0.2)]
    [&_.ant-select]:w-full [&_.ant-select-selector]:!bg-transparent [&_.ant-select-selector]:!border-none [&_.ant-select-selector]:!shadow-none [&_.ant-select-selector]:!p-0
    [&_.ant-picker]:!bg-transparent [&_.ant-picker]:!border-none [&_.ant-picker]:!shadow-none [&_.ant-picker]:w-full [&_.ant-picker]:!p-0
  `;
  const inputIconClasses = "text-[#9ca3af] text-[1.1rem] mr-3 shrink-0";
  const inputClasses = "bg-transparent outline-none border-none leading-none font-medium text-[0.95rem] text-[#1f2937] w-full placeholder-[#9ca3af]";
  
  const solidButtonClasses = "w-full max-w-[380px] bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 border-none outline-none h-12 rounded-full text-white font-semibold my-4 shadow-[0_4px_12px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2 transition-all duration-300 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_6px_18px_rgba(99,102,241,0.45)] disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none";

  const panelsContainerClasses = "absolute h-full w-full top-0 left-0 grid grid-cols-1 grid-rows-[1fr_2fr_1fr] lg:grid-cols-2 lg:grid-rows-1";
  const panelBaseClasses = "flex flex-row lg:flex-col justify-around lg:justify-center items-center lg:items-end text-center z-10 px-[8%] py-8 lg:p-0 col-start-1 lg:col-auto";
  
  const leftPanelClasses = `${panelBaseClasses} row-start-1 lg:row-start-auto lg:pr-[16%] lg:pl-[10%] lg:pt-[3rem] lg:pb-[2rem] ${isSignUp ? "pointer-events-none" : "pointer-events-auto"}`;
  const rightPanelClasses = `${panelBaseClasses} row-start-3 lg:row-start-auto lg:pl-[16%] lg:pr-[10%] lg:pt-[3rem] lg:pb-[2rem] ${isSignUp ? "pointer-events-auto" : "pointer-events-none"}`;

  const panelContentBaseClasses = "text-white transition-transform duration-[900ms] delay-[800ms] lg:delay-[600ms] ease-in-out flex flex-col items-center";
  
  const leftPanelContentClasses = `${panelContentBaseClasses} ${isSignUp ? "-translate-y-[300px] lg:translate-y-0 lg:-translate-x-[800px]" : "translate-y-0 lg:translate-x-0"}`;
  const rightPanelContentClasses = `${panelContentBaseClasses} ${isSignUp ? "translate-y-0 lg:translate-x-0" : "translate-y-[300px] lg:translate-y-0 lg:translate-x-[800px]"}`;

  const panelTitleClasses = "font-bold leading-tight text-[1.75rem] mb-3 text-white";
  const panelTextClasses = "text-[0.925rem] py-2 pb-6 text-white/85 leading-[1.5] max-w-[280px]";
  const outlineButtonClasses = "bg-transparent border-2 border-white w-[140px] h-[44px] rounded-full font-semibold text-[0.9rem] text-white transition-all duration-300 cursor-pointer hover:bg-white/15 hover:-translate-y-0.5";

  return (
    <div className={wrapperClasses}>
      <div className={cardClasses}>
        <div className={backgroundCircleClasses} />

        <div className={formsContainerClasses}>
          <div className={signinSignupContainerClasses}>
            {/* SIGN IN FORM */}
            <form className={signInFormClasses} onSubmit={handleLoginSubmit}>
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
                  onClick={() => handleModeChange(true)}
                  className="text-indigo-600 font-semibold underline hover:text-indigo-800 transition-colors"
                >
                  Sign up
                </button>
              </div>
            </form>

            {/* SIGN UP FORM */}
            <form className={signUpFormClasses} onSubmit={handleRegisterSubmit}>
              <h2 className={authTitleClasses}>Create Account</h2>
              <p className={authSubtitleClasses}>Join ATeens community today</p>

              {regError && (
                <div className="w-full max-w-[380px] p-2.5 mb-2 text-xs bg-red-50 border border-red-200 text-red-600 rounded-xl text-center">
                  {regError}
                </div>
              )}

              {regSuccess && (
                <div className="w-full max-w-[380px] p-2.5 mb-2 text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-center font-medium">
                  {regSuccess}
                </div>
              )}

              {/* Ministry Roles Selection */}
              <div className={`${inputWrapperClasses} !h-auto min-h-[48px] !py-1`}>
                <TeamOutlined className={inputIconClasses} />
                <Select
                  mode="multiple"
                  placeholder="Select Ministry Role(s)"
                  value={regRoles}
                  onChange={(vals) => setRegRoles(vals)}
                  options={MINISTRY_ROLES}
                  className="w-full text-xs"
                  maxTagCount="responsive"
                />
              </div>

              {/* Username */}
              <div className={inputWrapperClasses}>
                <UserOutlined className={inputIconClasses} />
                <input
                  type="text"
                  placeholder="Username (min 4 characters)"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  autoComplete="username"
                  required
                  className={inputClasses}
                />
              </div>

              {/* Date of Birth */}
              <div className={inputWrapperClasses}>
                <CalendarOutlined className={inputIconClasses} />
                <DatePicker
                  placeholder="Date of Birth"
                  value={regDob}
                  onChange={(d) => setRegDob(d)}
                  format="YYYY-MM-DD"
                  className="w-full text-sm"
                  allowClear
                />
              </div>

              {/* Conditional Leader Fields */}
              {isLeaderSelected && (
                <div className="w-full max-w-[380px] grid grid-cols-2 gap-2 my-0.5">
                  <div className={`${inputWrapperClasses} !w-full !max-w-none !my-1`}>
                    <WomanOutlined className={inputIconClasses} />
                    <Select
                      placeholder="Gender"
                      value={regGender}
                      onChange={(v) => setRegGender(v)}
                      options={GENDER_OPTIONS}
                      className="w-full text-xs"
                    />
                  </div>
                  <div className={`${inputWrapperClasses} !w-full !max-w-none !my-1`}>
                    <ReadOutlined className={inputIconClasses} />
                    <Select
                      placeholder="Grade"
                      value={regGrade}
                      onChange={(v) => setRegGrade(v)}
                      options={GRADE_OPTIONS}
                      className="w-full text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Password */}
              <div className={inputWrapperClasses}>
                <LockOutlined className={inputIconClasses} />
                <input
                  type="password"
                  placeholder="Password (min 6 characters)"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  autoComplete="new-password"
                  required
                  className={inputClasses}
                />
              </div>

              {/* Confirm Password */}
              <div className={inputWrapperClasses}>
                <LockOutlined className={inputIconClasses} />
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  autoComplete="new-password"
                  required
                  className={inputClasses}
                />
              </div>

              <button
                type="submit"
                disabled={regLoading}
                className={solidButtonClasses}
              >
                {regLoading ? (
                  <>
                    <Spin size="small" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  "Create Account"
                )}
              </button>

              <div className="mt-2 text-xs text-gray-500 lg:hidden">
                Already registered?{" "}
                <button
                  type="button"
                  onClick={() => handleModeChange(false)}
                  className="text-indigo-600 font-semibold underline hover:text-indigo-800 transition-colors"
                >
                  Sign in
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* SIDE PANELS */}
        <div className={panelsContainerClasses}>
          {/* Left Panel (Visible during Sign In) */}
          <div className={leftPanelClasses}>
            <div className={leftPanelContentClasses}>
              <h3 className={panelTitleClasses}>New here?</h3>
              <p className={panelTextClasses}>
                Join ATeens today! Register your account to manage cell groups,
                fellowship attendance, and sports activities.
              </p>
              <button
                type="button"
                className={outlineButtonClasses}
                onClick={() => handleModeChange(true)}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Right Panel (Visible during Sign Up) */}
          <div className={rightPanelClasses}>
            <div className={rightPanelContentClasses}>
              <h3 className={panelTitleClasses}>One of us?</h3>
              <p className={panelTextClasses}>
                Welcome back! Sign in with your username and password to continue
                to your dashboard.
              </p>
              <button
                type="button"
                className={outlineButtonClasses}
                onClick={() => handleModeChange(false)}
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
