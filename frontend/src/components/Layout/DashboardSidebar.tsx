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
import { useTheme } from "next-themes";

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
  const { resolvedTheme } = useTheme();
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
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed h-screen left-0 top-0 bottom-0 bg-white/80 dark:bg-black/20 backdrop-blur-2xl border-r border-gray-200 dark:border-white/10 z-50 transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${
          isEffectivelyCollapsed ? "lg:w-20" : "lg:w-64"
        } w-64`}
      >
        <div className="h-16 flex items-center shrink-0 px-4 transition-all duration-300 overflow-hidden border-b border-gray-200 dark:border-white/5">
          {isEffectivelyCollapsed ? (
            <div className="w-full flex justify-center">
              <Button
                type="text"
                style={{ fontSize: "20px" }}
                icon={<MenuUnfoldOutlined className="text-gray-500 dark:text-[rgba(255,255,255,0.7)]" />}
                onClick={() => setIsCollapsed(false)}
                className="hidden lg:block hover:bg-gray-100 dark:hover:bg-white/5"
              />
            </div>
          ) : (
            <div className="w-full flex justify-between items-center px-2">
              <span className="text-gray-900 dark:text-[rgba(255,255,255,0.95)] font-semibold text-lg tracking-tight">ATeens</span>
              <Button
                type="text"
                icon={<MenuFoldOutlined className="text-gray-500 dark:text-[rgba(255,255,255,0.7)] text-xl" />}
                onClick={() => setIsCollapsed(true)}
                className="hidden lg:block hover:bg-gray-100 dark:hover:bg-white/5"
              />
            </div>
          )}
        </div>

        <div className="flex-grow overflow-y-auto overflow-x-hidden pt-4">
          <Menu
            theme={resolvedTheme === "dark" ? "dark" : "light"}
            mode="inline"
            selectedKeys={[pathname]}
            items={getMenuItems()}
            className="border-r-0 !bg-transparent"
            inlineCollapsed={isEffectivelyCollapsed}
          />
        </div>
      </div>
    </>
  );
}
