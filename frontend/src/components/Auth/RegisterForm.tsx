"use client";

import React, { useState } from "react";
import { DatePicker, Select, message, Spin } from "antd";
import {
  UserOutlined,
  LockOutlined,
  CalendarOutlined,
  TeamOutlined,
  WomanOutlined,
  ReadOutlined,
} from "@ant-design/icons";
import type { Dayjs } from "dayjs";
import { authService } from "@/services/auth.service";
import type { RegisterRequest } from "@/types";
import { validateRegistration } from "@/lib/validator";
import {
  inputWrapperClasses,
  inputIconClasses,
  inputClasses,
  solidButtonClasses,
  authTitleClasses,
  authSubtitleClasses,
} from "./AuthStyles";

const MINISTRY_ROLES = [
  { value: "leader", label: "FC Leader" },
  { value: "fcl", label: "FCL Coordinator" },
  { value: "sports", label: "Sports Team" },
  { value: "admin", label: "Admin" },
];

const GRADE_OPTIONS = [7, 8, 9, 10, 11, 12].map((g) => ({
  value: g,
  label: `Grade ${g}`,
}));

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

interface RegisterFormProps {
  className: string;
  onSwitchMode: () => void;
  onRegisterSuccess: (username: string) => void;
}

export default function RegisterForm({
  className,
  onSwitchMode,
  onRegisterSuccess,
}: RegisterFormProps) {
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

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);
    setRegSuccess(null);

    const validationError = validateRegistration({
      roles: regRoles,
      username: regUsername,
      dob: regDob,
      gender: regGender,
      grade: regGrade,
      password: regPassword,
      confirmPassword: regConfirm,
    });

    if (validationError) {
      setRegError(validationError);
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

      // Notify parent to switch mode after 2.5 seconds
      setTimeout(() => {
        onRegisterSuccess(regUsername);
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

  return (
    <form className={className} onSubmit={handleRegisterSubmit}>
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
        <>
          <div className={inputWrapperClasses}>
            <WomanOutlined className={inputIconClasses} />
            <Select
              placeholder="Gender"
              value={regGender}
              onChange={(v) => setRegGender(v)}
              options={GENDER_OPTIONS}
              className="w-full text-[0.95rem]"
            />
          </div>
          <div className={inputWrapperClasses}>
            <ReadOutlined className={inputIconClasses} />
            <Select
              placeholder="Grade"
              value={regGrade}
              onChange={(v) => setRegGrade(v)}
              options={GRADE_OPTIONS}
              className="w-full text-[0.95rem]"
            />
          </div>
        </>
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
          onClick={onSwitchMode}
          className="text-indigo-600 font-semibold underline hover:text-indigo-800 transition-colors"
        >
          Sign in
        </button>
      </div>
    </form>
  );
}
