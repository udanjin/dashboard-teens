"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, DatePicker, Spin, Button } from "antd";
import {
  LineChartOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import dayjs, { type Dayjs } from "dayjs";
import Chart from "chart.js/auto";
import { fclService } from "@/services";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { PERMISSIONS } from "@/types";

export default function AttendanceTrendWidget() {
  const [filterDate, setFilterDate] = useState<Dayjs>(dayjs());
  const [chartData, setChartData] = useState<{ labels: string[]; data: number[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const { hasPermission } = useRoleAccess();
  const canViewFclSummary = hasPermission(PERMISSIONS.FCL_VIEW_SUMMARY);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      setLoading(true);
      try {
        const res = await fclService.getWeeklyStats({
          month: filterDate.month() + 1,
          year: filterDate.year(),
        });
        if (isMounted) {
          setChartData(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch weekly attendance", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStats();

    return () => {
      isMounted = false;
    };
  }, [filterDate]);

  useEffect(() => {
    if (!chartRef.current || !chartData) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const ctx = chartRef.current.getContext("2d");
    if (ctx) {
      // Create subtle gradient for bars
      const gradient = ctx.createLinearGradient(0, 0, 0, 300);
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.85)"); // blue-500
      gradient.addColorStop(1, "rgba(99, 102, 241, 0.4)"); // indigo-500

      chartInstance.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: chartData.labels,
          datasets: [
            {
              label: "Total Present",
              data: chartData.data,
              backgroundColor: gradient,
              borderColor: "rgba(59, 130, 246, 1)",
              borderWidth: 1.5,
              borderRadius: 8,
              borderSkipped: false,
              barPercentage: 0.55,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
            tooltip: {
              backgroundColor: "rgba(17, 24, 39, 0.9)",
              padding: 10,
              titleFont: { size: 13 },
              bodyFont: { size: 13 },
              callbacks: {
                label: (item) => ` ${item.parsed.y} Present`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 12 } },
            },
            y: {
              beginAtZero: true,
              grid: {
                color: "rgba(229, 231, 235, 0.5)",
              },
              ticks: {
                stepSize: 5,
                font: { size: 11 },
              },
            },
          },
        },
      });
    }

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [chartData]);

  // Insights
  const totalMonthAttendance = chartData?.data?.reduce((a, b) => a + b, 0) ?? 0;
  const nonZeroWeeks = chartData?.data?.filter((n) => n > 0) || [];
  const avgAttendance = nonZeroWeeks.length
    ? Math.round(totalMonthAttendance / nonZeroWeeks.length)
    : 0;
  const peakAttendance = chartData?.data?.length ? Math.max(...chartData.data) : 0;

  return (

    <Card
      bordered={false}
      className="shadow-sm hover:shadow-md transition-shadow rounded-xl border border-gray-100 mb-6"
      title={
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg text-base">
            <LineChartOutlined />
          </div>
          <div>
            <span className="font-semibold text-gray-800 text-base">
              FCL Attendance Trend (All Leaders)
            </span>
            <p className="text-xs font-normal text-gray-400">
              Weekly attendance compiled across all leader groups
            </p>
          </div>
        </div>
      }
      extra={
        <DatePicker
          picker="month"
          value={filterDate}
          allowClear={false}
          onChange={(date) => date && setFilterDate(date)}
          className="rounded-lg text-xs"
        />
      }
    >
      {/* Mini highlight badges */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 p-3 bg-gray-50/70 rounded-xl border border-gray-100">
        <div className="text-center sm:text-left">
          <span className="text-[11px] text-gray-400 uppercase font-medium">Total Attendance</span>
          <p className="text-base sm:text-lg font-bold text-gray-800 m-0">
            {totalMonthAttendance}{" "}
            <span className="text-xs font-normal text-gray-500">attendees</span>
          </p>
        </div>
        <div className="text-center sm:text-left border-x border-gray-200 px-2 sm:px-4">
          <span className="text-[11px] text-gray-400 uppercase font-medium">Weekly Average</span>
          <p className="text-base sm:text-lg font-bold text-blue-600 m-0">
            {avgAttendance}{" "}
            <span className="text-xs font-normal text-gray-500">/ week</span>
          </p>
        </div>
        <div className="text-center sm:text-left">
          <span className="text-[11px] text-gray-400 uppercase font-medium">Peak Week</span>
          <p className="text-base sm:text-lg font-bold text-emerald-600 m-0">
            {peakAttendance}{" "}
            <span className="text-xs font-normal text-gray-500">attendees</span>
          </p>
        </div>
      </div>

      <div className="h-[260px] w-full relative">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spin tip="Loading chart..." />
          </div>
        ) : (
          <canvas ref={chartRef} />
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Aggregated data across all leader cell groups for this month.
        </span>
        <Link href="/fcl/leaders">
          <Button
            type="link"
            size="small"
            className="text-xs text-blue-600 font-medium hover:text-blue-700 p-0 flex items-center gap-1"
          >
            <span>View All Leaders Summary</span>
            <ArrowRightOutlined className="text-[10px]" />
          </Button>
        </Link>
      </div>
    </Card>
  );
}
