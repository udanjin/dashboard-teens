"use client";

import { useState } from "react";
import {
  Button,
  Form,
  Input,
  message,
  Card,
  Typography,
  Select,
  Row,
  Col,
  DatePicker,
} from "antd";
import axiosInstance from "@/lib/axiosInstance";
import { useRouter } from "next/navigation";
import { UserOutlined, LockOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<string | null>(null);
  const account = [
    { value: "member", label: "Regular Member" },
    { value: "leader", label: "Leader" },
  ];

  const gradeOptions = [
    { value: 7, label: "7" },
    { value: 8, label: "8" },
    { value: 9, label: "9" },
    { value: 10, label: "10" },
    { value: 11, label: "11" },
    { value: 12, label: "12" },
  ];
  const genderOption = [
    { value: "Laki-laki", label: "Laki-laki" },
    { value: "Perempuan", label: "Perempuan" },
  ];
  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const payload: any = {
        accountType: values.accountType,
        username: values.username,
        password: values.password,
        dob: values.dob ? values.dob.format("YYYY-MM-DD") : null,
      };

      if (values.accountType === "leader") {
        (payload.gender = values.gender), (payload.grade = values.grade);
      }
      await axiosInstance.post("/users/register", payload);
      message.success(
        "Registration successful! Your account is now pending approval from an administrator."
      );
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.error || "Registration failed. Please try again.";
      message.error(errorMessage);
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card
        className="w-full max-w-md shadow-lg"
        bordered={false}
        bodyStyle={{ padding: 0 }}
      >
        {/* Header with gradient background matching login */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 text-center rounded-tr-lg rounded-tl-lg">
          <Title level={2} className="!text-white !mb-2">
            Create Account
          </Title>
          <Text className="text-indigo-100">
            Sign up for your ATeens Dashboard
          </Text>
        </div>

        {/* Form with proper padding and spacing */}
        <div className="p-6">
          <Form
            name="register"
            onFinish={handleFinish}
            layout="vertical"
            className="space-y-4"
          >
            <Form.Item
              label="Registering As"
              name="accountType"
              className="font-medium text-gray-700"
              rules={[
                { required: true, message: "please choose your account type" },
              ]}
            >
              <Select
                placeholder="Select your intended account type"
                onChange={(value) => setAccountType(value)}
                options={account}
                size="large"
              />
            </Form.Item>
            <Form.Item
              name="username"
              label={
                <span className="text-gray-700 font-medium">Username</span>
              }
              rules={[
                { required: true, message: "Please input your username!" },
                {
                  min: 4,
                  message: "Username must be at least 4 characters long.",
                },
              ]}
              className="mb-4"
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="e.g., admin"
                className="h-10 rounded-lg border-gray-200"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="dob"
              label={<span className="font-medium w-full">Date of Birth</span>}
              rules={[
                {
                  required: true,
                  message: "Please select your birth date!",
                },
              ]}
            >
              <DatePicker className="w-full rounded-lg h-10" size="large" />
            </Form.Item>
            {accountType === "leader" && (
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="gender"
                    label="Gender"
                    rules={[
                      {
                        required: true,
                        message: "Gender is required for Leaders",
                      },
                    ]}
                  >
                    <Select
                      placeholder="Select gender"
                      options={genderOption}
                      className="h-11"
                      size="large"
                    />
                  </Form.Item>
                </Col>
                <Col span={12} className="h-11">
                  <Form.Item
                    name="grade"
                    label="Grade"
                    rules={[
                      {
                        required: true,
                        message: "Grade is required for Leaders",
                      },
                    ]}
                  >
                    <Select
                      placeholder="Select grade"
                      options={gradeOptions}
                      size="large"
                    />
                  </Form.Item>
                </Col>
              </Row>
            )}
            <Form.Item
              name="password"
              label={
                <span className="text-gray-700 font-medium">Password</span>
              }
              rules={[
                { required: true, message: "Please input your password!" },
                {
                  min: 6,
                  message: "Password must be at least 6 characters long.",
                },
              ]}
              hasFeedback
              className="mb-4"
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="••••••••"
                className="h-10 rounded-lg border-gray-200"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirm"
              label={
                <span className="text-gray-700 font-medium">
                  Confirm Password
                </span>
              }
              dependencies={["password"]}
              hasFeedback
              rules={[
                { required: true, message: "Please confirm your password!" },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue("password") === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(
                      new Error(
                        "The two passwords that you entered do not match!"
                      )
                    );
                  },
                }),
              ]}
              className="mb-6"
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="••••••••"
                className="h-10 rounded-lg border-gray-200"
                size="large"
              />
            </Form.Item>

            <Form.Item className="mb-0">
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                className="w-full h-12 text-white font-semibold rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 border-none shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
                style={{
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  boxShadow: "0 8px 32px rgba(102, 126, 234, 0.4)",
                }}
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
            </Form.Item>

            <div className="text-center mt-4">
              <Text className="text-gray-600">
                Already have an account?{" "}
                <Button
                  type="link"
                  className="p-0 text-indigo-600 hover:text-indigo-700"
                  onClick={() => router.push("/login")}
                >
                  Sign in
                </Button>
              </Text>
            </div>
          </Form>
        </div>
      </Card>
    </div>
  );
}
