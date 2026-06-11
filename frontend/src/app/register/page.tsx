"use client";

import { useMemo, useState } from "react";
import { Button, Card, Form, Typography, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import DynamicForm, { type FieldConfig } from "@/components/Common/DynamicForm";
import { authService } from "@/services";
import type { RegisterRequest } from "@/types";
import type { Dayjs } from "dayjs";

const { Title, Text } = Typography;

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
          props: { prefix: <UserOutlined className="text-gray-400" />, size: "large" as const },
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
          props: { prefix: <LockOutlined className="text-gray-400" />, size: "large" as const },
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
          props: { prefix: <LockOutlined className="text-gray-400" />, size: "large" as const },
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg" bordered={false} styles={{ body: { padding: 0 } }}>
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-center rounded-t-lg">
          <Title level={2} className="!text-white !mb-2">Create Account</Title>
          <Text className="text-indigo-100">Sign up for your ATeens Dashboard</Text>
        </div>

        <div className="p-6">
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
                <Form.Item className="mb-0 mt-4">
                  <Button
                    type="primary"
                    htmlType="submit"
                    loading={loading}
                    className="w-full h-12 rounded-full"
                    style={{
                      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      border: "none",
                    }}
                  >
                    {loading ? "Creating Account..." : "Create Account"}
                  </Button>
                </Form.Item>
                <div className="text-center mt-4">
                  <Text className="text-gray-600">
                    Already have an account?{" "}
                    <Button type="link" className="p-0" onClick={() => router.push("/login")}>Sign in</Button>
                  </Text>
                </div>
              </>
            }
          />
        </div>
      </Card>
    </div>
  );
}
