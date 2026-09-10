"use client";

import React, { useState, useEffect } from "react";
import { Card, Button, Tag, Skeleton, Empty } from "antd";
import {
  TrophyOutlined,
  ArrowRightOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import dayjs from "dayjs";
import { sportsService } from "@/services";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { SportEvent, SportReportKpis } from "@/types";

export default function SportsSummaryWidget() {
  const [cashBalance, setCashBalance] = useState<number | null>(null);
  const [kpis, setKpis] = useState<SportReportKpis | null>(null);
  const [recentEvents, setRecentEvents] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchSportsData = async () => {
      setLoading(true);
      try {
        const [cashRes, allRes] = await Promise.allSettled([
          sportsService.getCashBalance(),
          sportsService.getAll(),
        ]);

        if (isMounted) {
          if (cashRes.status === "fulfilled") {
            setCashBalance(cashRes.value.data);
          }
          if (allRes.status === "fulfilled") {
            setKpis(allRes.value.kpis);
            // Get 4 most recent events
            const sorted = [...allRes.value.data].sort(
              (a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
            );
            setRecentEvents(sorted.slice(0, 4));
          }
        }
      } catch (err) {
        console.error("Failed to load sports summary", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchSportsData();

    return () => {
      isMounted = false;
    };
  }, []);

  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case "futsal":
        return "green";
      case "badminton":
        return "blue";
      case "basket":
        return "orange";
      case "football":
        return "cyan";
      default:
        return "purple";
    }
  };

  return (
    <Card
      bordered={false}
      className="shadow-sm hover:shadow-md transition-shadow rounded-xl border border-gray-100 mb-6"
      title={
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-base">
            <TrophyOutlined />
          </div>
          <div>
            <span className="font-semibold text-gray-800 text-base">Sports Overview</span>
            <p className="text-xs font-normal text-gray-400">Financial balance & recent activities</p>
          </div>
        </div>
      }
      extra={
        <Link href="/sports">
          <Button
            type="link"
            size="small"
            className="text-xs text-blue-600 font-medium hover:text-blue-700 p-0 flex items-center gap-1"
          >
            <span>Sports Page</span>
            <ArrowRightOutlined className="text-[10px]" />
          </Button>
        </Link>
      }
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : (
        <>
          {/* Top Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-[11px] text-gray-400 uppercase font-medium">Active Fund</span>
              <p
                className={`text-lg font-bold m-0 ${
                  (cashBalance ?? 0) >= 0 ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {cashBalance !== null ? formatCurrency(cashBalance) : "Rp 0"}
              </p>
            </div>

            <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100/60">
              <span className="text-[11px] text-emerald-600 uppercase font-medium flex items-center gap-1">
                <ArrowUpOutlined className="text-[10px]" /> Income
              </span>
              <p className="text-lg font-bold text-gray-800 m-0">
                {formatCurrency(kpis?.totalIncome ?? 0)}
              </p>
            </div>

            <div className="p-3 bg-rose-50/50 rounded-xl border border-rose-100/60">
              <span className="text-[11px] text-rose-600 uppercase font-medium flex items-center gap-1">
                <ArrowDownOutlined className="text-[10px]" /> Expenses
              </span>
              <p className="text-lg font-bold text-gray-800 m-0">
                {formatCurrency(kpis?.totalExpenses ?? 0)}
              </p>
            </div>

            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/60">
              <span className="text-[11px] text-blue-600 uppercase font-medium">Total Events</span>
              <p className="text-lg font-bold text-gray-800 m-0">
                {kpis?.totalEvents ?? 0}{" "}
                <span className="text-xs font-normal text-gray-500">
                  ({kpis?.totalParticipants ?? 0} participants)
                </span>
              </p>
            </div>
          </div>

          {/* Recent Events Table/List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Recent Activities
              </span>
            </div>

            {recentEvents.length === 0 ? (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={<span className="text-xs text-gray-400">No sports events recorded yet</span>}
              />
            ) : (
              <div className="divide-y divide-gray-100">
                {recentEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="py-2.5 flex items-center justify-between hover:bg-gray-50 px-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Tag
                        color={getCategoryColor(evt.category)}
                        className="font-medium text-xs rounded border-0"
                      >
                        {evt.category}
                      </Tag>
                      <div>
                        <p className="text-sm font-medium text-gray-800 m-0 leading-snug">
                          {evt.venue || "Venue not specified"}
                        </p>
                        <span className="text-xs text-gray-400">
                          {formatDate(evt.date)} • {evt.participant} Participants
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold m-0 ${
                          evt.totalpemasukan - evt.totalpengeluaran >= 0
                            ? "text-emerald-600"
                            : "text-red-500"
                        }`}
                      >
                        {evt.totalpemasukan - evt.totalpengeluaran >= 0 ? "+" : ""}
                        {formatCurrency(evt.totalpemasukan - evt.totalpengeluaran)}
                      </p>
                      <span className="text-[11px] text-gray-400">Net event</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </Card>
  );
}
