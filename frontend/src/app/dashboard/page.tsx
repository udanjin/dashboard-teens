"use client";

import React from "react";
import { Spin, Row, Col } from "antd";
import { useAuth } from "@/context/AuthContext";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { PERMISSIONS } from "@/types";

import DashboardHero from "@/components/Dashboard/DashboardHero";
import DashboardKpis from "@/components/Dashboard/DashboardKpis";
import AttendanceTrendWidget from "@/components/Dashboard/AttendanceTrendWidget";
import LeaderCellGroupWidget from "@/components/Dashboard/LeaderCellGroupWidget";
import SportsSummaryWidget from "@/components/Dashboard/SportsSummaryWidget";
import UpcomingBirthdays from "@/components/Dashboard/UpcomingBirthdays";
import PendingAlertsWidget from "@/components/Dashboard/PendingAlertsWidget";

export default function DashboardHome() {
  const { user, loading } = useAuth();
  const { hasPermission } = useRoleAccess();

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
        <Spin size="large" tip="Loading Dashboard..." />
      </div>
    );
  }

  const canViewSports = hasPermission(PERMISSIONS.SPORTS_VIEW);
  const canViewFclSummary = hasPermission(PERMISSIONS.FCL_VIEW_SUMMARY);
  const canManageFclMembers = hasPermission(PERMISSIONS.FCL_MANAGE_MEMBERS);

  return (
    <div className="w-full min-h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* 1. Hero Header & Quick Actions */}
      <DashboardHero user={user} />

      {/* 2. Top Metric Cards (Glanceable KPIs) */}
      <DashboardKpis />

      {/* 3. Main Dashboard 2-Column Grid */}
      <Row gutter={[20, 20]}>
        {/* Left Column (Primary Analytics & Overviews) */}
        <Col xs={24} lg={15} xl={16}>
          <div className="flex flex-col gap-6 w-full">
            {/* If user can view summary (Admin / FCL coordinator), show All Leaders Trend */}
            {canViewFclSummary && <AttendanceTrendWidget />}

            {/* If user can manage FCL members (Leader), show My Cell Group Overview */}
            {canManageFclMembers && <LeaderCellGroupWidget />}

            {/* Sports summary if user has sports permission */}
            {canViewSports && <SportsSummaryWidget />}
          </div>
        </Col>

        {/* Right Column (Contextual Widgets & Actions) */}
        <Col xs={24} lg={9} xl={8}>
          <div className="flex flex-col gap-6 w-full">
            <UpcomingBirthdays />
            <PendingAlertsWidget />
          </div>
        </Col>
      </Row>
    </div>
  );
}
