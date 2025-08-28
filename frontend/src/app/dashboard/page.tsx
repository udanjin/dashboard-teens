"use client";

// Corrected: Changed path aliases to relative paths to resolve the module.
import { useAuth } from "@/context/AuthContext";
import SportsHome from "@/components/Dashboard/SportsHome";
import FclAdminHome from "@/components/Dashboard/FclHome";
import { Spin, Typography, Space } from "antd";
import FclAttendanceChart from "@/components/Dashboard/FclChart";

const { Title } = Typography;

export default function DashboardHome() {
  const { user, loading } = useAuth();

  // Menampilkan loading spinner saat data pengguna sedang diperiksa
  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Spin size="large" />
      </div>
    );
  }

  // Fungsi untuk memilih komponen mana yang akan ditampilkan
  const renderHomeByRole = () => {
    switch (user.role) {
      case "sports":
        return <SportsHome />;

      case "fcl":
        return (
          <Space direction="vertical" size="large" className="w-full">
            <FclAdminHome />
            <FclAttendanceChart />
          </Space>
        );

      // 2. Logika baru untuk role 'admin'
      case "admin":
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

      default:
        // Tampilan default jika pengguna tidak memiliki role spesifik
        return <div>Selamat datang, {user.username}!</div>;
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-64px)] p-6">
      {renderHomeByRole()}
    </div>
  );
}
