"use client";

import { Card, Col, Row, Statistic } from "antd";
import { ArrowUpOutlined, ArrowDownOutlined } from "@ant-design/icons";
import { formatCurrency } from "@/lib/formatters";
import type { SportReportKpis } from "@/types/sports.types";

interface SportsDashboardCardsProps {
  kpis: SportReportKpis | null;
}

export default function SportsDashboardCards({ kpis }: SportsDashboardCardsProps) {
  const totalIncome = kpis?.totalIncome ?? 0;
  const totalExpense = kpis?.totalExpenses ?? 0;
  const netBalance = kpis?.netBalance ?? 0;
  const totalParticipants = kpis?.totalParticipants ?? 0;
  const totalEvents = kpis?.totalEvents ?? 0;

  return (
    <Row gutter={[16, 16]} className="mb-6">
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} className="shadow-sm">
          <Statistic
            title="Total Income"
            value={totalIncome}
            formatter={(val) => formatCurrency(Number(val))}
            valueStyle={{ color: '#3f8600' }}
            prefix={<ArrowUpOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} className="shadow-sm">
          <Statistic
            title="Total Expenses"
            value={totalExpense}
            formatter={(val) => formatCurrency(Number(val))}
            valueStyle={{ color: '#cf1322' }}
            prefix={<ArrowDownOutlined />}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} className="shadow-sm">
          <Statistic
            title="Net Balance / Fund"
            value={netBalance}
            formatter={(val) => formatCurrency(Number(val))}
            valueStyle={{ color: netBalance >= 0 ? '#3f8600' : '#cf1322' }}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card bordered={false} className="shadow-sm">
          <Statistic
            title="Participants & Events"
            value={totalParticipants}
            suffix={`/ ${totalEvents} Events`}
          />
        </Card>
      </Col>
    </Row>
  );
}
