"use client";

import { useMemo, useState } from "react";
import { Button, Form, message } from "antd";
import { UserOutlined, LockOutlined, ArrowRightOutlined, LoadingOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import DynamicForm, { type FieldConfig } from "@/components/Common/DynamicForm";
import { authService } from "@/services";
import type { RegisterRequest } from "@/types";
import type { Dayjs } from "dayjs";
import ThemeToggle from "@/components/Common/ThemeToggle";

const ACCOUNT_TYPES = [
  { value: "member", label: "Regular Member" },
  { value: "leader", label: "Leader" },
];
const GRADE_OPTIONS = [7, 8, 9, 10, 11, 12].map((g) => ({ value: g, label: String(g) }));
const GENDER_OPTIONS = [
  { value: "Laki-laki", label: "Laki-laki" },
  { value: "Perempuan", label: "Perempuan" },
];

interface RegisterFormValues {
  accountType: "member" | "leader";
  username: string;
  password: string;
  confirm: string;
  dob: Dayjs;
  gender?: string;
  grade?: number;
}

export default function RegisterPage() {
  const [form] = Form.useForm<RegisterFormValues>();
  const [loading, setLoading] = useState(false);
  const [accountType, setAccountType] = useState<string | null>(null);
  const router = useRouter();

  const fields: FieldConfig<RegisterFormValues>[][] = useMemo(
    () => [
      [
        {
          name: "accountType",
          label: "Registering As",
          componentType: "select",
          options: ACCOUNT_TYPES,
          placeholder: "Select your intended account type",
          rules: [{ required: true, message: "Please choose your account type" }],
        },
      ],
      [
        {
          name: "username",
          label: "Username",
          componentType: "input",
          placeholder: "e.g., admin",
          rules: [
            { required: true, message: "Please input your username!" },
            { min: 4, message: "Username must be at least 4 characters long." },
          ],
          props: { prefix: <UserOutlined className="text-gray-400 dark:text-white/40" /> },
        },
      ],
      [
        {
          name: "dob",
          label: "Date of Birth",
          componentType: "datepicker",
          rules: [{ required: true, message: "Please select your birth date!" }],
        },
      ],
      [
        {
          name: "gender",
          label: "Gender",
          componentType: "select",
          options: GENDER_OPTIONS,
          placeholder: "Select gender",
          hidden: accountType !== "leader",
          rules: [{ required: accountType === "leader", message: "Gender is required for Leaders" }],
        },
        {
          name: "grade",
          label: "Grade",
          componentType: "select",
          options: GRADE_OPTIONS,
          placeholder: "Select grade",
          hidden: accountType !== "leader",
          rules: [{ required: accountType === "leader", message: "Grade is required for Leaders" }],
        },
      ],
      [
        {
          name: "password",
          label: "Password",
          componentType: "password",
          placeholder: "••••••••",
          hasFeedback: true,
          rules: [
            { required: true, message: "Please input your password!" },
            { min: 6, message: "Password must be at least 6 characters long." },
          ],
          props: { prefix: <LockOutlined className="text-gray-400 dark:text-white/40" /> },
        },
      ],
      [
        {
          name: "confirm",
          label: "Confirm Password",
          componentType: "password",
          placeholder: "••••••••",
          hasFeedback: true,
          dependencies: ["password"],
          rules: [
            { required: true, message: "Please confirm your password!" },
            ({ getFieldValue }: { getFieldValue: (name: string) => string }) => ({
              validator(_: unknown, value: string) {
                if (!value || getFieldValue("password") === value) return Promise.resolve();
                return Promise.reject(new Error("The two passwords do not match!"));
              },
            }),
          ],
          props: { prefix: <LockOutlined className="text-gray-400 dark:text-white/40" /> },
        },
      ],
    ],
    [accountType]
  );

  const handleFinish = async (values: RegisterFormValues) => {
    setLoading(true);
    try {
      const payload: RegisterRequest = {
        accountType: values.accountType,
        username: values.username,
        password: values.password,
        dob: values.dob ? values.dob.format("YYYY-MM-DD") : null,
        ...(values.accountType === "leader" && { gender: values.gender, grade: values.grade }),
      };
      await authService.register(payload);
      message.success("Registration successful! Your account is now pending approval.");
      setTimeout(() => router.push("/login"), 2000);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      message.error(err.response?.data?.error ?? "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-transparent p-4 relative z-10 py-12">
      {/* Theme Toggle at top right */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      {/* Outer Shell (Double-Bezel Architecture) */}
      <div className="w-full max-w-lg p-2 rounded-[2rem] bg-white/40 dark:bg-white/5 ring-1 ring-black/5 dark:ring-white/10 shadow-2xl backdrop-blur-2xl">
        {/* Inner Core */}
        <div className="bg-white dark:bg-[#0A0A0A] rounded-[calc(2rem-0.5rem)] overflow-hidden shadow-[inset_0_1px_1px_rgba(0,0,0,0.05)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
          
          <div className="p-10 pb-4 text-center">
            <div className="inline-block rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-medium bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-white/70 mb-4">
              Join Us
            </div>
            <h1 className="text-3xl font-semibold text-gray-900 dark:text-[rgba(255,255,255,0.95)] tracking-tight">Create Account</h1>
            <p className="text-gray-500 dark:text-[rgba(255,255,255,0.45)] mt-2 text-sm">Sign up for your ATeens Dashboard</p>
          </div>

          <div className="px-10 pb-8">
            <DynamicForm
              form={form}
              fields={fields}
              onFinish={handleFinish}
              onValuesChange={(changed) => {
                if ("accountType" in changed) setAccountType(changed.accountType ?? null);
              }}
              loading={loading}
              footer={
                <>
                  <button
                    type="submit"
                    disabled={loading}
                    className="group w-full flex items-center justify-between pl-6 pr-2 h-14 rounded-full text-white dark:text-[#050505] font-medium bg-[#7C3AED] dark:bg-[#FAFAFA] hover:bg-[#6D28D9] dark:hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#0A0A0A] focus:ring-[#7C3AED] dark:focus:ring-white transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-8"
                  >
                    <span className="flex-1 text-center pr-2">
                      {loading ? "Creating Account..." : "Create Account"}
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
                  <div className="text-center mt-6">
                    <span className="text-gray-500 dark:text-[rgba(255,255,255,0.45)] text-sm">
                      Already have an account?{" "}
                      <Button type="link" className="p-0 text-[#7C3AED] dark:text-white hover:opacity-80" onClick={() => router.push("/login")}>
                        Sign in
                      </Button>
                    </span>
                  </div>
                </>
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
