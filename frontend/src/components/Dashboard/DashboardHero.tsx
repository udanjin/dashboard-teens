"use client";

import React from "react";
import { Tag, Button } from "antd";
import {
  CheckCircleOutlined,
  TrophyOutlined,
  UsergroupAddOutlined,
  SafetyCertificateOutlined,
  SolutionOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import dayjs from "dayjs";
import type { UserInfo } from "@/types";
import { PERMISSIONS } from "@/types";
import { useRoleAccess } from "@/hooks/useRoleAccess";

interface DashboardHeroProps {
  user: UserInfo;
}

export default function DashboardHero({ user }: DashboardHeroProps) {
  const { hasPermission } = useRoleAccess();
  const today = dayjs().format("dddd, MMMM D, YYYY");

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "purple";
      case "leader":
        return "blue";
      case "sports":
        return "green";
      case "fcl":
        return "cyan";
      default:
        return "default";
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-600 p-6 sm:p-8 text-white shadow-md mb-6">
      {/* Subtle decorative shapes */}
      <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute right-40 -bottom-16 h-48 w-48 rounded-full bg-indigo-400/20 blur-xl" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-blue-100 text-xs sm:text-sm font-medium tracking-wide uppercase mb-1">
            <span>📅 {today}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Welcome back, {user.name || user.username}! 👋
          </h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Overview of Teens fellowship attendance, group leaders, and sports activities.
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-3">
            <span className="text-xs text-blue-200 mr-1 font-medium">Roles:</span>
            {user.roles && user.roles.length > 0 ? (
              user.roles.map((role) => (
                <Tag
                  key={role}
                  color={getRoleColor(role)}
                  className="font-semibold text-xs border-0 px-2.5 py-0.5 rounded-full"
                >
                  {role.toUpperCase()}
                </Tag>
              ))
            ) : (
              <Tag color="default" className="text-xs">
                MEMBER
              </Tag>
            )}
            {user.grade && (
              <Tag color="geekblue" className="text-xs font-semibold rounded-full border-0">
                Grade {user.grade}
              </Tag>
            )}
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap gap-2.5 md:flex-col lg:flex-row items-stretch md:items-end">
          {hasPermission(PERMISSIONS.ATTENDANCE_MANAGE) && (
            <Link href="/fcl">
              <Button
                type="primary"
                icon={<CheckCircleOutlined />}
                className="bg-white text-blue-700 hover:!bg-blue-50 hover:!text-blue-800 font-semibold border-none shadow-sm h-10 px-4 rounded-lg flex items-center"
              >
                Record Attendance
              </Button>
            </Link>
          )}

          {hasPermission(PERMISSIONS.FCL_VIEW_SUMMARY) && (
            <Link href="/fcl/leaders">
              <Button
                icon={<SolutionOutlined />}
                className="bg-white/20 hover:!bg-white/30 text-white font-semibold border border-white/30 backdrop-blur-sm h-10 px-4 rounded-lg flex items-center"
              >
                Leaders Summary
              </Button>
            </Link>
          )}

          {hasPermission(PERMISSIONS.SPORTS_VIEW) && (
            <Link href="/sports">
              <Button
                icon={<TrophyOutlined />}
                className="bg-white/20 hover:!bg-white/30 text-white font-semibold border border-white/30 backdrop-blur-sm h-10 px-4 rounded-lg flex items-center"
              >
                Sports Activities
              </Button>
            </Link>
          )}

          {hasPermission(PERMISSIONS.FCL_MANAGE_MEMBERS) && (
            <Link href="/fcl">
              <Button
                icon={<UsergroupAddOutlined />}
                className="bg-white/20 hover:!bg-white/30 text-white font-semibold border border-white/30 backdrop-blur-sm h-10 px-4 rounded-lg flex items-center"
              >
                Manage Members
              </Button>
            </Link>
          )}

          {hasPermission(PERMISSIONS.APPROVAL_VIEW) && (
            <Link href="/approval">
              <Button
                icon={<SafetyCertificateOutlined />}
                className="bg-white/20 hover:!bg-white/30 text-white font-semibold border border-white/30 backdrop-blur-sm h-10 px-4 rounded-lg flex items-center"
              >
                User Approvals
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
