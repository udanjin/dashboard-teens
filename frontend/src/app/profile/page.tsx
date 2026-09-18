"use client";

import React, { useEffect, useState } from "react";
import { Form, Input, Button, DatePicker, Card, Typography, Select, message, Spin, Row, Col } from "antd";
import { UserOutlined, CalendarOutlined, SafetyCertificateOutlined } from "@ant-design/icons";
import { useAuth } from "@/context/AuthContext";
import { userService } from "@/services/user.service";
import dayjs from "dayjs";
import ProtectedLayout from "@/components/Layout/ProtectedLayout";

const { Title, Text } = Typography;

export default function ProfilePage() {
  const { user, login } = useAuth();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      form.setFieldsValue({
        username: user.username,
        name: user.name,
        dob: user.dob ? dayjs(user.dob) : undefined,
        gender: user.gender,
        grade: user.grade,
      });
    }
  }, [user, form]);

  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      await userService.updateProfile({
        name: values.name,
        dob: values.dob ? values.dob.format("YYYY-MM-DD") : undefined,
      });
      message.success("Profile updated successfully!");
      // Option to force reload or re-fetch user info, if context allows
      // For now, reload window is the simplest way to refresh JWT payload if stored in cookie, 
      // but in our app we might just need to rely on the backend returning updated data on next fetch.
      // Assuming a simple reload is enough or we rely on re-login
      window.location.reload();
    } catch (error: any) {
      message.error(error.response?.data?.error || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <ProtectedLayout>
        <div className="flex justify-center items-center h-full">
          <Spin size="large" />
        </div>
      </ProtectedLayout>
    );
  }

  return (
    <ProtectedLayout>
      <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 w-full">
        <div className="mb-8">
          <Title level={2} className="!mb-1">Profile Settings</Title>
          <Text type="secondary">Manage your personal information and preferences.</Text>
        </div>

        <Card className="shadow-sm border-gray-100 rounded-xl overflow-hidden">
          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            size="large"
            requiredMark={false}
          >
            <Row gutter={[24, 16]}>
              <Col xs={24} md={12}>
                <Form.Item label={<span className="font-medium">Username</span>} name="username">
                  <Input prefix={<UserOutlined className="text-gray-400" />} disabled className="bg-gray-50" />
                </Form.Item>
              </Col>
              <Col xs={24} md={12}>
                <Form.Item 
                  label={<span className="font-medium">Full Name</span>} 
                  name="name" 
                  rules={[{ required: true, message: "Name is required" }]}
                >
                  <Input placeholder="Enter your full name" />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item 
                  label={<span className="font-medium">Date of Birth</span>} 
                  name="dob" 
                  rules={[{ required: true, message: "Date of birth is required" }]}
                >
                  <DatePicker className="w-full" format="MMMM D, YYYY" prefix={<CalendarOutlined className="text-gray-400" />} />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item label={<span className="font-medium">Gender</span>} name="gender" tooltip="Only admins can change this field">
                  <Select disabled className="bg-gray-50">
                    <Select.Option value="Male">Male</Select.Option>
                    <Select.Option value="Female">Female</Select.Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24}>
                <Form.Item label={<span className="font-medium">Grade / Class</span>} name="grade" tooltip="Only admins can change your grade">
                  <Input prefix={<SafetyCertificateOutlined className="text-gray-400" />} disabled className="bg-gray-50" />
                </Form.Item>
              </Col>
            </Row>

            <div className="pt-6 mt-6 border-t border-gray-100 flex justify-end">
              <Button type="primary" htmlType="submit" loading={loading} className="px-8 font-medium h-10 rounded-lg">
                Save Changes
              </Button>
            </div>
          </Form>
        </Card>
      </div>
    </ProtectedLayout>
  );
}
