"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Card, Row, Col, Skeleton, Tooltip } from "antd";
import {
  TeamOutlined,
  CheckCircleOutlined,
  WalletOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { fclService, sportsService } from "@/services";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { PERMISSIONS } from "@/types";
import { formatCurrency } from "@/lib/formatters";

interface KpiData {
  totalLeaders: number;
  maleLeaders: number;
  femaleLeaders: number;
  leaderSubmission: {
    submitted: number;
    total: number;
    date: string;
    unsubmitted: string[];
  } | null;
  sportsCashBalance: number | null;
}

export default function DashboardKpis() {
  const { hasPermission } = useRoleAccess();
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KpiData>({
    totalLeaders: 0,
    maleLeaders: 0,
    femaleLeaders: 0,
    leaderSubmission: null,
    sportsCashBalance: null,
  });

  const canViewSports = hasPermission(PERMISSIONS.SPORTS_VIEW);
  const canViewFclSummary = hasPermission(PERMISSIONS.FCL_VIEW_SUMMARY);

  useEffect(() => {
    let isMounted = true;

    const fetchKpis = async () => {
      setLoading(true);
      const now = dayjs();
      const currentMonth = now.month() + 1;
      const currentYear = now.year();

      try {
        const promises: Promise<any>[] = [];

        // 1. Leaders summary (FCL only)
        if (canViewFclSummary) {
          promises.push(fclService.getSummary(currentMonth, currentYear));
        } else {
          promises.push(Promise.resolve(null));
        }

        // 2. Leader submission status (FCL only)
        if (canViewFclSummary) {
          promises.push(fclService.getLeaderSubmissionStatus());
        } else {
          promises.push(Promise.resolve(null));
        }

        // 3. Sports cash balance (Sports role only)
        if (canViewSports) {
          promises.push(sportsService.getCashBalance());
        } else {
          promises.push(Promise.resolve(null));
        }

        const results = await Promise.allSettled(promises);

        let totalLeaders = 0;
        let maleLeaders = 0;
        let femaleLeaders = 0;
        let leaderSubmission: KpiData["leaderSubmission"] = null;
        let sportsCashBalance: number | null = null;

        // Process Leaders count
        if (canViewFclSummary && results[0].status === "fulfilled" && results[0].value) {
          const summaryData = results[0].value.data || [];
          summaryData.forEach((leader: any) => {
            const g = (leader.gender || "").toLowerCase();
            if (g === "male") maleLeaders++;
            else if (g === "female") femaleLeaders++;
          });
          totalLeaders = summaryData.length;
        }

        // Process Leader submission status
        if (canViewFclSummary && results[1].status === "fulfilled" && results[1].value) {
          leaderSubmission = results[1].value.data || results[1].value;
        }

        // Process Sports Cash
        if (canViewSports && results[2].status === "fulfilled" && results[2].value) {
          sportsCashBalance = results[2].value.data;
        }

        if (isMounted) {
          setKpiData({
            totalLeaders,
            maleLeaders,
            femaleLeaders,
            leaderSubmission,
            sportsCashBalance,
          });
        }
      } catch (err) {
        console.error("Failed to load dashboard KPIs", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchKpis();

    return () => {
      isMounted = false;
    };
  }, [canViewFclSummary, canViewSports]);

  const currentMonthName = dayjs().format("MMMM");

  // Determine which cards are visible
  const visibleCards = useMemo(() => {
    const cards: string[] = [];
    if (canViewFclSummary) cards.push("leaders");
    if (canViewFclSummary) cards.push("submission");
    if (canViewSports) cards.push("sports");
    return cards;
  }, [canViewFclSummary, canViewSports]);

  // Dynamic column width based on visible card count
  const getColSpan = () => {
    const count = visibleCards.length;
    switch (count) {
      case 1: return { xs: 24, sm: 24, md: 24, lg: 24, xl: 24 };
      case 2: return { xs: 24, sm: 12, md: 12, lg: 12, xl: 12 };
      case 3: return { xs: 24, sm: 12, md: 8, lg: 8, xl: 8 };
      case 4: return { xs: 24, sm: 12, md: 12, lg: 12, xl: 6 };
      default: return { xs: 24, sm: 12, md: 8, lg: 6, xl: 6 };
    }
  };

  const colSpan = getColSpan();

  const renderCard = (content: React.ReactNode) => (
    <Card
      bordered={false}
      className="shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl h-full border border-gray-100"
    >
      {loading ? <Skeleton active paragraph={{ rows: 1 }} /> : content}
    </Card>
  );

  return (
    <Row gutter={[16, 16]} className="mb-6">
      {/* 1. Total FC Leaders (FCL/Admin only) */}
      {canViewFclSummary && (
        <Col {...colSpan}>
          {renderCard(
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block truncate">
                  Total FC Leaders
                </span>
                <div className="text-xl sm:text-2xl font-bold text-gray-800 mt-1">
                  {kpiData.totalLeaders}{" "}
                  <span className="text-sm font-normal text-gray-500">Leaders</span>
                </div>
                <div className="text-xs text-gray-500 mt-2 flex items-center gap-1.5 flex-wrap">
                  {(kpiData.maleLeaders > 0 || kpiData.femaleLeaders > 0) ? (
                    <>
                      <span className="text-blue-600 font-medium">👦 {kpiData.maleLeaders} Male</span>
                      <span>•</span>
                      <span className="text-pink-600 font-medium">👧 {kpiData.femaleLeaders} Female</span>
                      {kpiData.totalLeaders > kpiData.maleLeaders + kpiData.femaleLeaders && (
                        <>
                          <span>•</span>
                          <span className="text-gray-500 font-medium">
                            {kpiData.totalLeaders - kpiData.maleLeaders - kpiData.femaleLeaders} Unspecified
                          </span>
                        </>
                      )}
                    </>
                  ) : (
                    <span>All registered leaders</span>
                  )}
                </div>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl shrink-0">
                <TeamOutlined />
              </div>
            </div>
          )}
        </Col>
      )}

      {/* 2. Leaders Submitted Attendance (FCL/Admin only) */}
      {canViewFclSummary && (
        <Col {...colSpan}>
          {renderCard(
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block truncate">
                  Leaders Submitted
                </span>
                <Tooltip
                  title={
                    kpiData.leaderSubmission?.unsubmitted && kpiData.leaderSubmission.unsubmitted.length > 0
                      ? (
                        <div className="max-h-48 overflow-y-auto">
                          <p className="font-semibold mb-1 border-b border-white/20 pb-1">Unsubmitted Leaders:</p>
                          <ul className="list-disc pl-4 m-0 text-xs">
                            {kpiData.leaderSubmission.unsubmitted.map(name => (
                              <li key={name}>{name}</li>
                            ))}
                          </ul>
                        </div>
                      ) : "All leaders submitted!"
                  }
                  placement="bottom"
                  overlayStyle={{ maxWidth: 300 }}
                >
                  <div className="text-xl sm:text-2xl font-bold text-gray-800 mt-1 cursor-help w-fit flex flex-col">
                    <div>
                      {kpiData.leaderSubmission
                        ? `${kpiData.leaderSubmission.submitted} / ${kpiData.leaderSubmission.total}`
                        : "—"}{" "}
                      <span className="text-sm font-normal text-gray-500">Leaders</span>
                    </div>
                    <span className="text-[10px] font-normal text-blue-500 mt-0.5">Hover to see unsubmitted</span>
                  </div>
                </Tooltip>
                <div className="text-xs text-gray-500 mt-2">
                  <span>
                    {kpiData.leaderSubmission
                      ? `Week of ${dayjs(kpiData.leaderSubmission.date).format("MMM D")}`
                      : "This week"}
                  </span>
                </div>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl shrink-0">
                <CheckCircleOutlined />
              </div>
            </div>
          )}
        </Col>
      )}

      {/* 3. Sports Cash Balance (Sports role only) */}
      {canViewSports && (
        <Col {...colSpan}>
          {renderCard(
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider block truncate">
                  Sports Cash Fund
                </span>
                <div
                  className={`text-xl sm:text-2xl font-bold mt-1 truncate ${(kpiData.sportsCashBalance ?? 0) >= 0 ? "text-emerald-600" : "text-red-500"
                    }`}
                >
                  {kpiData.sportsCashBalance !== null
                    ? formatCurrency(kpiData.sportsCashBalance)
                    : "Rp 0"}
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  <span>Active operational balance</span>
                </div>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl shrink-0">
                <WalletOutlined />
              </div>
            </div>
          )}
        </Col>
      )}
    </Row>
  );
}
