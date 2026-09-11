"use client";

import React, { useEffect, useState } from "react";
import { Card, Row, Col, Skeleton } from "antd";
import {
  TeamOutlined,
  LineChartOutlined,
  WalletOutlined,
  GiftOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";
import { fclService, sportsService, attendanceService } from "@/services";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { PERMISSIONS } from "@/types";
import { formatCurrency } from "@/lib/formatters";

interface KpiData {
  totalMembers: number;
  maleMembers: number;
  femaleMembers: number;
  latestAttendance: number | null;
  latestAttendanceLabel: string;
  sportsCashBalance: number | null;
  monthlyBirthdaysCount: number;
}

export default function DashboardKpis() {
  const { hasPermission } = useRoleAccess();
  const [loading, setLoading] = useState(true);
  const [kpiData, setKpiData] = useState<KpiData>({
    totalMembers: 0,
    maleMembers: 0,
    femaleMembers: 0,
    latestAttendance: null,
    latestAttendanceLabel: "",
    sportsCashBalance: null,
    monthlyBirthdaysCount: 0,
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

        // 1. Members
        if (canViewFclSummary) {
          promises.push(fclService.getSummary(currentMonth, currentYear));
        } else {
          promises.push(fclService.getMyMembers());
        }

        // 2. Attendance stats (All leaders if summary, or group stats for leader)
        if (canViewFclSummary) {
          promises.push(
            fclService.getWeeklyStats({ month: currentMonth, year: currentYear })
          );
        } else {
          promises.push(
            attendanceService.getSingleAttendance(currentMonth, currentYear)
          );
        }

        // 3. Sports cash balance (if allowed)
        if (canViewSports) {
          promises.push(sportsService.getCashBalance());
        } else {
          promises.push(Promise.resolve(null));
        }

        // 4. Birthdays
        promises.push(fclService.getBirthdays());

        const results = await Promise.allSettled(promises);

        let totalMembers = 0;
        let maleMembers = 0;
        let femaleMembers = 0;
        let latestAttendance: number | null = null;
        let latestAttendanceLabel = "";
        let sportsCashBalance: number | null = null;
        let monthlyBirthdaysCount = 0;

        // Process Members
        if (results[0].status === "fulfilled" && results[0].value) {
          if (canViewFclSummary) {
            const summaryData = results[0].value.data || [];
            let mCount = 0;
            let fCount = 0;
            summaryData.forEach((leader: any) => {
              const g = leader.gender?.toLowerCase() || "";
              if (g === "laki-laki" || g === "male") mCount++;
              else if (g === "perempuan" || g === "female") fCount++;
            });
            totalMembers = summaryData.length;
            maleMembers = mCount;
            femaleMembers = fCount;
          } else {
            const myMembers = results[0].value.data || [];
            totalMembers = myMembers.length;
          }
        }

        // Process Attendance
        if (results[1].status === "fulfilled" && results[1].value) {
          if (canViewFclSummary) {
            const weeklyStats = results[1].value.data;
            if (weeklyStats?.data?.length) {
              const dataArr: number[] = weeklyStats.data;
              const labelsArr: string[] = weeklyStats.labels;
              const datesArr: string[] = weeklyStats.dates || [];

              const now = dayjs();
              let targetIndex = dataArr.length - 1; // fallback

              for (let i = datesArr.length - 1; i >= 0; i--) {
                if (dayjs(datesArr[i]).startOf('day').valueOf() <= now.startOf('day').valueOf()) {
                  targetIndex = i;
                  break;
                }
              }

              latestAttendance = dataArr[targetIndex] ?? 0;
              latestAttendanceLabel = labelsArr[targetIndex] || "Latest Week";
            }
          } else {
            // For Leaders: calculate present count from their single attendance stats
            const stats = results[1].value.data?.memberStats || [];
            const totalPresent = stats.reduce(
              (sum: number, s: any) => sum + (s.presentCount || 0),
              0
            );
            latestAttendance = totalPresent;
            latestAttendanceLabel = "This Month in Group";
          }
        }

        // Process Sports Cash
        if (canViewSports && results[2].status === "fulfilled" && results[2].value) {
          sportsCashBalance = results[2].value.data;
        }

        // Process Birthdays
        if (results[3].status === "fulfilled" && results[3].value) {
          const bdays = results[3].value.data || [];
          const currentMonthZeroIndex = now.month();
          monthlyBirthdaysCount = bdays.filter((b: any) => {
            return dayjs(b.date).month() === currentMonthZeroIndex;
          }).length;
        }

        if (isMounted) {
          setKpiData({
            totalMembers,
            maleMembers,
            femaleMembers,
            latestAttendance,
            latestAttendanceLabel,
            sportsCashBalance,
            monthlyBirthdaysCount,
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

  return (
    <Row gutter={[16, 16]} className="mb-6 w-full">
      {/* 1. Total Members Card */}
      <Col xs={24} sm={12} xl={canViewSports ? 12 : 8} xxl={canViewSports ? 6 : 8}>
        <Card
          bordered={false}
          className="shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl h-full border border-gray-100"
        >
          {loading ? (
            <Skeleton active paragraph={{ rows: 1 }} />
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {canViewFclSummary ? "Total Cell Group Leaders" : "My Group Members"}
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1">
                  {kpiData.totalMembers}{" "}
                  <span className="text-sm font-normal text-gray-500">
                    {canViewFclSummary ? "Leaders" : "Members"}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-2 flex items-center gap-1.5 flex-wrap">
                  {canViewFclSummary && (kpiData.maleMembers > 0 || kpiData.femaleMembers > 0) ? (
                    <>
                      <span className="text-blue-600 font-medium">👦 {kpiData.maleMembers} Male</span>
                      <span>•</span>
                      <span className="text-pink-600 font-medium">👧 {kpiData.femaleMembers} Female</span>
                      {kpiData.totalMembers > kpiData.maleMembers + kpiData.femaleMembers && (
                        <>
                          <span>•</span>
                          <span className="text-gray-500 font-medium">
                            ❓ {kpiData.totalMembers - kpiData.maleMembers - kpiData.femaleMembers} Unspecified
                          </span>
                        </>
                      )}
                    </>
                  ) : (
                    <span>Active members in group</span>
                  )}
                </div>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl">
                <TeamOutlined />
              </div>
            </div>
          )}
        </Card>
      </Col>

      {/* 2. Latest Attendance Card */}
      <Col xs={24} sm={12} xl={canViewSports ? 12 : 8} xxl={canViewSports ? 6 : 8}>
        <Card
          bordered={false}
          className="shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl h-full border border-gray-100"
        >
          {loading ? (
            <Skeleton active paragraph={{ rows: 1 }} />
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  {canViewFclSummary ? "Latest Attendance (All Leaders)" : "Group Attendance"}
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1">
                  {kpiData.latestAttendance !== null ? kpiData.latestAttendance : "—"}{" "}
                  <span className="text-sm font-normal text-gray-500">Present</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  <span>{kpiData.latestAttendanceLabel || "This Month"}</span>
                </div>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl">
                <LineChartOutlined />
              </div>
            </div>
          )}
        </Card>
      </Col>

      {/* 3. Sports Cash Balance */}
      {canViewSports && (
        <Col xs={24} sm={12} xl={6}>
          <Card
            bordered={false}
            className="shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl h-full border border-gray-100"
          >
            {loading ? (
              <Skeleton active paragraph={{ rows: 1 }} />
            ) : (
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Sports Cash Fund
                  </span>
                  <div
                    className={`text-2xl sm:text-3xl font-bold mt-1 ${(kpiData.sportsCashBalance ?? 0) >= 0 ? "text-emerald-600" : "text-red-500"
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
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl">
                  <WalletOutlined />
                </div>
              </div>
            )}
          </Card>
        </Col>
      )}
      {/* 4. Birthdays this month */}
      <Col xs={24} sm={12} xl={canViewSports ? 12 : 8} xxl={canViewSports ? 6 : 8}>
        <Card
          bordered={false}
          className="shadow-sm hover:shadow-md transition-shadow duration-300 rounded-xl h-full border border-gray-100"
        >
          {loading ? (
            <Skeleton active paragraph={{ rows: 1 }} />
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Birthdays in {currentMonthName}
                </span>
                <div className="text-2xl sm:text-3xl font-bold text-purple-700 mt-1">
                  {kpiData.monthlyBirthdaysCount}{" "}
                  <span className="text-sm font-normal text-gray-500">Birthdays</span>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                  <span>Celebrations this month</span>
                </div>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center text-xl">
                <GiftOutlined />
              </div>
            </div>
          )}
        </Card>
      </Col>
    </Row>
  );
}
