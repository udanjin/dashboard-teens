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
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import logo from "@/assets/logo.png"; // Pastikan path logo benar

// Props untuk mobile view dan state yang dikontrol oleh induk
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

  // Status visual sidebar: diciutkan jika isCollapsed=true DAN tidak sedang di-hover.
  const isEffectivelyCollapsed = isCollapsed && !isHovered;

  const hasAccess = (requiredRoles: string[]): boolean => {
    if (!user || !user.roles) return false;
    if (user.roles.includes("admin")) return true;
    return user.roles.some((role) => requiredRoles.includes(role));
  };

  const getMenuItems = () => {
    const items = [
      { key: "/dashboard", icon: <HomeOutlined />, label: "Home" },
    ];
    if (hasAccess(["sports", "admin"])) {
      items.push({ key: "/sports", icon: <TrophyOutlined />, label: "Sports" });
    }
    if (hasAccess(["fcl", "leader", "admin"])) {
      items.push({ key: "/fcl", icon: <TeamOutlined />, label: "FCL" });
    }
    if (hasAccess(["admin"])) {
      items.push({
        key: "/approval",
        icon: <CheckOutlined />,
        label: "User Approval",
      });
    }
    return items.map((item) => ({
      ...item,
      label: <Link href={item.key}>{item.label}</Link>,
    }));
  };

  if (!user) return null;

  return (
    <>
      {/* Overlay untuk mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Container Sidebar Utama */}
      <div
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`fixed h-screen left-0 top-0 bottom-0 bg-[#001529] shadow-lg z-50 transition-all duration-300 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${
          isEffectivelyCollapsed ? "lg:w-20" : "lg:w-64"
        } w-64`}
      >
        {/* ================== UI HEADER BARU ================== */}
        <div className="h-16 flex items-center shrink-0 px-4 transition-all duration-300 overflow-hidden">
          {isEffectivelyCollapsed ? (
            // Saat diciutkan: hanya tombol di tengah
            <div className="w-full flex justify-center">
              <Button
                type="text"
                style={{ color: "white",  fontSize:"24px"}} // Pindahkan style ke komponen Button
                icon={<MenuUnfoldOutlined className="text-4xl" />}
                onClick={() => setIsCollapsed(false)} // Klik untuk membuka permanen
                className="hidden lg:block"
              />
            </div>
          ) : (
            // Saat dilebarkan: logo di kiri, tombol di kanan
            <div className="w-full flex justify-between items-center">
              <Image src={logo} width={100} height={40} alt="logo" />
              <Button
                type="text"
                icon={
                  <MenuFoldOutlined
                    className="text-lg"
                    style={{ color: "white",  fontSize:"24px"}}
                  />
                }
                onClick={() => setIsCollapsed(true)} // Klik untuk menciutkan
                className="hidden lg:block"
              />
            </div>
          )}
        </div>

        {/* Menu Items */}
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
