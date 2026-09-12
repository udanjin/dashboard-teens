"use client";

import React from "react";
import { Menu } from "antd";
import {
  HomeOutlined,
  TeamOutlined,
  TrophyOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS } from "@/types";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
  isHovered: boolean;
  setIsHovered: (isHovered: boolean) => void;
}

export default function DashboardSidebar({
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
  isHovered,
  setIsHovered,
}: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { hasPermission } = useRoleAccess();
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const isEffectivelyCollapsed = !isMobile && isCollapsed && !isHovered;

  const getMenuItems = () => {
    const items = [
      { key: "/dashboard", icon: <HomeOutlined />, label: "Home" },
    ];
    if (hasPermission(PERMISSIONS.SPORTS_VIEW)) {
      items.push({ key: "/sports", icon: <TrophyOutlined />, label: "Sports" });
    }
    if (hasPermission(PERMISSIONS.FCL_VIEW)) {
      items.push({ key: "/fcl", icon: <TeamOutlined />, label: "FCL" });
    }
    if (hasPermission(PERMISSIONS.FCL_VIEW_SUMMARY)) {
      items.push({ key: "/fcl/leaders", icon: <SolutionOutlined />, label: "Leaders Summary" });
    }
    if (hasPermission(PERMISSIONS.APPROVAL_VIEW)) {
      items.push({ key: "/approval", icon: <TeamOutlined />, label: "User Management" });
    }
    return items.map((item) => ({
      ...item,
      label: (
        <Link href={item.key} onClick={() => setIsOpen(false)}>
          {item.label}
        </Link>
      ),
    }));
  };

  if (!user) return null;

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed h-screen left-0 top-0 bottom-0 bg-white border-r border-gray-200 shadow-sm z-50 transition-all duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${
          isEffectivelyCollapsed ? "lg:w-20" : "lg:w-64"
        } w-64`}
      >
        {/* Logo / Brand */}
        <div className="h-16 flex items-center shrink-0 px-4 transition-all duration-300 overflow-hidden border-b border-gray-100">
          {isEffectivelyCollapsed ? (
            <div className="w-full flex justify-center">
              <span className="text-xl font-bold text-indigo-600">A</span>
            </div>
          ) : (
            <div className="w-full flex items-center gap-2">
              <span className="text-xl font-bold text-indigo-600">ATeens</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-grow overflow-y-auto overflow-x-hidden">
          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            items={getMenuItems()}
            className="border-r-0 !bg-transparent"
            inlineCollapsed={isEffectivelyCollapsed}
            style={{ borderInlineEnd: "none" }}
          />
        </div>
      </div>
    </>
  );
}
