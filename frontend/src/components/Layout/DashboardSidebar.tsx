"use client";

import { Menu, Button, Tooltip } from "antd";
import {
  CheckOutlined,
  HomeOutlined,
  TeamOutlined,
  TrophyOutlined,
  CloseOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useAuth } from "../../context/AuthContext";
import logo from "../../assets/logo.png";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

export default function DashboardSidebar({
  isOpen,
  setIsOpen,
  isCollapsed,
  setIsCollapsed,
}: SidebarProps) {
  const pathname = usePathname();
  const { user } = useAuth();

  const hasAccess = (requiredRole: string): boolean => {
    if (!user || !user.role) return false;
    if (user.role === "admin") return true;
    return user.role === requiredRole;
  };

  const getMenuItems = () => {
    const items = [
      {
        key: "/dashboard",
        icon: <HomeOutlined />,
        label: <Link href="/dashboard">Home</Link>,
      },
    ];

    if (user?.role === 'sports' || user?.role === 'admin') {
      items.push({
        key: "/sports",
        icon: <TrophyOutlined />,
        label: <Link href="/sports">Sports</Link>,
      });
    }

    if (user?.role === 'fcl' || user?.role === 'leader' || user?.role === 'admin') {
      items.push({
        key: "/fcl",
        icon: <TeamOutlined />,
        label: <Link href="/fcl">FCL</Link>,
      });
    }

    if (user?.role === 'admin') {
      items.push({
        key: "/approval",
        icon: <CheckOutlined />,
        label: <Link href="/approval">Approval</Link>,
      });
    }

    return items;
  };

  // Wrapper untuk menu items dengan tooltip saat collapsed
  const getMenuItemsWithTooltip = () => {
    const items = getMenuItems();

    if (!isCollapsed) return items;

    return items.map((item) => ({
      ...item,
      label: (
        <Tooltip
          title={
            item.key === "/dashboard"
              ? "Home"
              : item.key === "/sports"
              ? "Sports"
              : item.key === "/fcl"
              ? "fcl"
              : item.key === "/approval"
              ? "Approval"
              : ""
          }
          placement="right"
        >
          <Link href={item.key}></Link>
        </Tooltip>
      ),
    }));
  };

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Overlay untuk mobile */}
      <div
        className={`fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity lg:hidden ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar */}
      <div
        className={`fixed h-screen left-0 top-0 bottom-0 bg-[#001529] shadow-lg z-50 transition-all duration-300 ${
          // Mobile: show/hide berdasarkan isOpen
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 ${
          // Desktop: width berdasarkan isCollapsed
          isCollapsed ? "lg:w-[80px]" : "lg:w-[250px]"
        } w-[250px]`}
      >
        {/* Header */}
        <div
          className={`h-16 bg-gray-900 m-4 rounded flex items-center justify-between px-4 ${
            isCollapsed ? "lg:justify-center lg:px-2" : ""
          }`}
        >
          {!isCollapsed && (
            <Image src={logo} width={100} height={100} alt="logo" />
          )}
          {isCollapsed && (
            <div className="hidden lg:block">
              <Image src={logo} width={40} height={40} alt="logo" />
            </div>
          )}

          {/* Close button untuk mobile */}
          <Button
            type="text"
            icon={<CloseOutlined className="text-white" />}
            onClick={() => setIsOpen(false)}
            className="lg:hidden"
          />

          {/* Toggle button untuk desktop */}
          <Button
            type="text"
            icon={
              isCollapsed ? (
                <MenuUnfoldOutlined className="text-white" />
              ) : (
                <MenuFoldOutlined className="text-white" />
              )
            }
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:block"
          />
        </div>

        {/* Menu */}
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          items={getMenuItemsWithTooltip()}
          className="px-2 border-r-0"
          inlineCollapsed={isCollapsed}
        />
      </div>
    </>
  );
}
