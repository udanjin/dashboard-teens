"use client";

import { Card, Col, Row, Statistic, Tooltip } from "antd";
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  InfoCircleOutlined,
  WalletOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { formatCurrency } from "@/lib/formatters";
import type { SportReportKpis } from "@/types/sports.types";

interface SportsDashboardCardsProps {
  kpis: SportReportKpis | null;
}

export default function SportsDashboardCards({ kpis }: SportsDashboardCardsProps) {
  const totalIncome = kpis?.totalIncome ?? 0;
  const totalExpense = kpis?.totalExpenses ?? 0;
  const netBalance = kpis?.netBalance ?? 0;
  const netAdjustment = kpis?.netAdjustment ?? 0;
  const totalParticipants = kpis?.totalParticipants ?? 0;
  const totalEvents = kpis?.totalEvents ?? 0;

  return (
    <Row gutter={[16, 16]} className="mb-6">
      {/* 1. Total Income */}
      <Col xs={24} sm={12} lg={6}>
        <Card
          bordered={false}
          className="shadow-sm hover:shadow-md transition-shadow rounded-xl border border-gray-100 h-full"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-emerald-600 uppercase tracking-wider">
                Total Income
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1">
                {formatCurrency(totalIncome)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Gross funds collected
              </div>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl">
              <ArrowUpOutlined />
            </div>
          </div>
        </Card>
      </Col>

      {/* 2. Total Expenses */}
      <Col xs={24} sm={12} lg={6}>
        <Card
          bordered={false}
          className="shadow-sm hover:shadow-md transition-shadow rounded-xl border border-gray-100 h-full"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-rose-600 uppercase tracking-wider">
                Total Expenses
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1">
                {formatCurrency(totalExpense)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Venues & operational costs
              </div>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center text-xl">
              <ArrowDownOutlined />
            </div>
          </div>
        </Card>
      </Col>

      {/* 3. Net Balance */}
      <Col xs={24} sm={12} lg={6}>
        <Card
          bordered={false}
          className="shadow-sm hover:shadow-md transition-shadow rounded-xl border border-gray-100 h-full"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider flex items-center gap-1">
                <span>Net Fund Balance</span>
                {netAdjustment !== 0 && (
                  <Tooltip
                    title={`Includes ${formatCurrency(Math.abs(netAdjustment))} in manual adjustments`}
                  >
                    <InfoCircleOutlined className="text-orange-400 cursor-pointer" />
                  </Tooltip>
                )}
              </span>
              <div
                className={`text-2xl sm:text-3xl font-bold mt-1 ${
                  netBalance >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {formatCurrency(netBalance)}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {netAdjustment !== 0 ? (
                  <span className="text-orange-500">
                    Adj: {netAdjustment > 0 ? "+" : ""}{formatCurrency(netAdjustment)}
                  </span>
                ) : (
                  "Active sports balance"
                )}
              </div>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center text-xl">
              <WalletOutlined />
            </div>
          </div>
        </Card>
      </Col>

      {/* 4. Events & Participants */}
      <Col xs={24} sm={12} lg={6}>
        <Card
          bordered={false}
          className="shadow-sm hover:shadow-md transition-shadow rounded-xl border border-gray-100 h-full"
        >
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-medium text-blue-600 uppercase tracking-wider">
                Participants & Events
              </span>
              <div className="text-2xl sm:text-3xl font-bold text-gray-800 mt-1">
                {totalParticipants}{" "}
                <span className="text-sm font-normal text-gray-500">
                  / {totalEvents} Events
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Total sports engagement
              </div>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl">
              <TrophyOutlined />
            </div>
          </div>
        </Card>
      </Col>
    </Row>
  );
}
