"use client";

import { useAuth } from "@/context/AuthContext";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import SportsHome from "@/components/Dashboard/SportsHome";
import FclAdminHome from "@/components/Dashboard/FclHome";
import BirthdayCalendar from "@/components/Dashboard/Calendar";
import { Spin, Typography, Space } from "antd";
import { PERMISSIONS } from "@/types";

const { Title } = Typography;

export default function DashboardHome() {
  const { user, loading } = useAuth();
  const { hasPermission } = useRoleAccess();

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-64px)] p-6">
      <Space direction="vertical" size="large" className="w-full">
        <Title level={2}>Welcome {user.username}</Title>
        <BirthdayCalendar />

        {hasPermission(PERMISSIONS.SPORTS_VIEW) && (
          <div>
            <Title level={3}>Sports Overview</Title>
            <SportsHome />
          </div>
        )}

        {hasPermission(PERMISSIONS.FCL_VIEW_SUMMARY) && (
          <div>
            <Title level={3}>FCL Overview</Title>
            <div className="mt-6">
              <FclAdminHome />
            </div>
          </div>
        )}
      </Space>
    </div>
  );
}
