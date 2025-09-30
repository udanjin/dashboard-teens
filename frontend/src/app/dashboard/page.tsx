"use client";

import { useAuth } from "@/context/AuthContext";
import SportsHome from "@/components/Dashboard/SportsHome";
import FclAdminHome from "@/components/Dashboard/FclHome";
import { Spin, Typography, Space } from "antd";
import FclAttendanceChart from "@/components/Dashboard/FclChart";
import BirthdayCalendar from "@/components/Dashboard/Calendar";

const { Title } = Typography;

export default function DashboardHome() {
  const { user, loading } = useAuth();

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Spin size="large" />
      </div>
    );
  }

  // This function is updated to check an array of roles
  const renderHomeByRole = () => {
    // Ensure user.roles is an array before checking
    const roles = user.roles || [];

    // Check for roles in order of priority (admin is highest)
    if (roles.includes("admin")) {
      return (
        <Space direction="vertical" size="large" className="w-full">
          <div>
            <Title level={3}>Sports Overview</Title>
            <SportsHome />
          </div>
          <div>
            <Title level={3}>FCL Overview</Title>
            <div className="mt-6">
              <FclAdminHome />
            </div>
            {/* <FclAttendanceChart /> */}
          </div>
        </Space>
      );
    }

    if (roles.includes("fcl")) {
      return (
        <Space direction="vertical" size="large" className="w-full">
          <FclAdminHome />
          <FclAttendanceChart />
        </Space>
      );
    }

    if (roles.includes("sports")) {
      return <SportsHome />;
    }

    // Default view for users with no specific dashboard role
    return <div></div>;
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] p-6">
      <Space direction="vertical" size="large" className="w-full">
        <Title level={2}>Welcome {user.username}</Title>
        {/* Kalender ulang tahun ditempatkan di sini, sehingga semua role bisa melihatnya */}
        <BirthdayCalendar />

        {/* Sisa dashboard dirender di bawah kalender */}
        {renderHomeByRole()}
      </Space>
    </div>
  );
}
