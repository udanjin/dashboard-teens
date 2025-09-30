"use client";

import { Layout } from "antd";
import DashboardSidebar from "@/components/Layout/DashboardSidebar";
import DashboardHeader from "@/components/Layout/DashboardHeader";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function SportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, loading, logout, user } = useAuth();
  const router = useRouter();

  // State untuk mengontrol sidebar
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(true); // Default diciutkan
  const [isHovered, setIsHovered] = useState(false);
  const isEffectivelyCollapsed = isCollapsed && !isHovered;
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, loading, router]);

  // Auto-collapse sidebar pada layar kecil
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsCollapsed(true);
      } else if (window.innerWidth >= 1024) {
        setIsCollapsed(false);
      }
    };

    // Set initial state
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <DashboardSidebar
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isHovered={isHovered}
        setIsHovered={setIsHovered}
      />

      <div
        className={`relative transition-all duration-300 ${
          // ================== LOGIKA YANG DIPERBARUI ==================
          // Mengganti kelas margin secara langsung untuk menghindari masalah prioritas CSS
          isEffectivelyCollapsed ? "lg:ml-20" : "lg:ml-64"
        }`}
      >
        {/* Asumsi Anda memiliki komponen Header yang juga perlu tahu status sidebar */}
        <DashboardHeader
          user={user}
          onLogout={logout}
          onMenuClick={() => setSidebarOpen(true)}
          sidebarCollapsed={isCollapsed}
        />
        <main className="px-6 pb-6 pt-20">{children}</main>
      </div>
    </div>
  );
}
