"use client";

import { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import { Card, Col, Row } from "antd";
import type { SportEvent } from "@/types";
import dayjs from "dayjs";
import { formatCurrency } from "@/lib/formatters";

interface SportsDashboardChartsProps {
  data: SportEvent[];
}

export default function SportsDashboardCharts({ data }: SportsDashboardChartsProps) {
  const barChartRef = useRef<HTMLCanvasElement>(null);
  const donutChartRef = useRef<HTMLCanvasElement>(null);
  const barChartInstance = useRef<Chart | null>(null);
  const donutChartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!barChartRef.current || !donutChartRef.current || !data) return;

    if (barChartInstance.current) barChartInstance.current.destroy();
    if (donutChartInstance.current) donutChartInstance.current.destroy();

    // 1. Prepare Data for Cash Flow Bar Chart (Month over Month)
    // Group by month
    const monthlyData: Record<string, { income: number; expense: number }> = {};
    data.forEach((item) => {
      const monthLabel = dayjs(item.date).format("MMM YYYY");
      if (!monthlyData[monthLabel]) monthlyData[monthLabel] = { income: 0, expense: 0 };
      monthlyData[monthLabel].income += item.totalpemasukan || 0;
      monthlyData[monthLabel].expense += item.totalpengeluaran || 0;
    });

    // Sort months chronologically
    const sortedMonths = Object.keys(monthlyData).sort((a, b) => dayjs(a, "MMM YYYY").valueOf() - dayjs(b, "MMM YYYY").valueOf());
    const incomeData = sortedMonths.map((m) => monthlyData[m].income);
    const expenseData = sortedMonths.map((m) => monthlyData[m].expense);

    const barCtx = barChartRef.current.getContext("2d");
    if (barCtx) {
      barChartInstance.current = new Chart(barCtx, {
        type: "bar",
        data: {
          labels: sortedMonths,
          datasets: [
            {
              label: "Income",
              data: incomeData,
              backgroundColor: "rgba(63, 134, 0, 0.7)",
              borderColor: "rgba(63, 134, 0, 1)",
              borderWidth: 1,
            },
            {
              label: "Expense",
              data: expenseData,
              backgroundColor: "rgba(207, 19, 34, 0.7)",
              borderColor: "rgba(207, 19, 34, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: function (context) {
                  let label = context.dataset.label || "";
                  if (label) label += ": ";
                  if (context.parsed.y !== null) {
                    label += formatCurrency(context.parsed.y);
                  }
                  return label;
                },
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function (value) {
                  return formatCurrency(Number(value));
                },
              },
            },
          },
        },
      });
    }

    // 2. Prepare Data for Category Breakdown Donut Chart (Participants by Category)
    const categoryData: Record<string, number> = {};
    data.forEach((item) => {
      const cat = item.category || "Unknown";
      if (!categoryData[cat]) categoryData[cat] = 0;
      categoryData[cat] += item.participant || 0;
    });

    const categories = Object.keys(categoryData);
    const participantCounts = categories.map((c) => categoryData[c]);

    const donutCtx = donutChartRef.current.getContext("2d");
    if (donutCtx) {
      donutChartInstance.current = new Chart(donutCtx, {
        type: "doughnut",
        data: {
          labels: categories,
          datasets: [
            {
              data: participantCounts,
              backgroundColor: [
                "rgba(54, 162, 235, 0.7)",
                "rgba(255, 99, 132, 0.7)",
                "rgba(255, 206, 86, 0.7)",
                "rgba(75, 192, 192, 0.7)",
              ],
              borderColor: [
                "rgba(54, 162, 235, 1)",
                "rgba(255, 99, 132, 1)",
                "rgba(255, 206, 86, 1)",
                "rgba(75, 192, 192, 1)",
              ],
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            tooltip: {
              callbacks: {
                label: function (context) {
                  let label = context.label || "";
                  if (label) label += ": ";
                  if (context.parsed !== null) {
                    label += `${context.parsed} Participants`;
                  }
                  return label;
                },
              },
            },
          },
        },
      });
    }

    return () => {
      if (barChartInstance.current) barChartInstance.current.destroy();
      if (donutChartInstance.current) donutChartInstance.current.destroy();
    };
  }, [data]);

  return (
    <Row gutter={[16, 16]} className="mb-6">
      <Col xs={24} lg={16}>
        <Card title="Cash Flow" bordered={false} className="shadow-sm h-[350px]">
          <div className="h-[250px] w-full">
            <canvas ref={barChartRef} />
          </div>
        </Card>
      </Col>
      <Col xs={24} lg={8}>
        <Card title="Participants by Sport" bordered={false} className="shadow-sm h-[350px]">
          <div className="h-[250px] w-full">
            <canvas ref={donutChartRef} />
          </div>
        </Card>
      </Col>
    </Row>
  );
}
