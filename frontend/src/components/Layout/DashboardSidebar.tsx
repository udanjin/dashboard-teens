"use client";

import React from "react";
import { Menu, Button } from "antd";
import {
  CheckOutlined,
  HomeOutlined,
  TeamOutlined,
  TrophyOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
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
  const isEffectivelyCollapsed = isCollapsed && !isHovered;

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
    if (hasPermission(PERMISSIONS.APPROVAL_VIEW)) {
      items.push({ key: "/approval", icon: <CheckOutlined />, label: "User Approval" });
    }
    return items.map((item) => ({
      ...item,
      label: <Link href={item.key}>{item.label}</Link>,
    }));
  };

  if (!user) return null;

  return (
    <>
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed h-screen left-0 top-0 bottom-0 bg-[#001529] shadow-lg z-50 transition-all duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${
          isEffectivelyCollapsed ? "lg:w-20" : "lg:w-64"
        } w-64`}
      >
        <div className="h-16 flex items-center shrink-0 px-4 transition-all duration-300 overflow-hidden">
          {isEffectivelyCollapsed ? (
            <div className="w-full flex justify-center">
              <Button
                type="text"
                style={{ color: "white", fontSize: "24px" }}
                icon={<MenuUnfoldOutlined />}
                onClick={() => setIsCollapsed(false)}
                className="hidden lg:block"
              />
            </div>
          ) : (
            <div className="w-full flex justify-between items-center">
              <span className="text-white font-bold text-lg">ATeens</span>
              <Button
                type="text"
                icon={<MenuFoldOutlined style={{ color: "white", fontSize: "24px" }} />}
                onClick={() => setIsCollapsed(true)}
                className="hidden lg:block"
              />
            </div>
          )}
        </div>

        <div className="flex-grow overflow-y-auto overflow-x-hidden">
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[pathname]}
            items={getMenuItems()}
            className="border-r-0"
            inlineCollapsed={isEffectivelyCollapsed}
          />
        </div>
      </div>
    </>
  );
}
