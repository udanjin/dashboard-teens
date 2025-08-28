"use client";

import { useState, useEffect, useRef } from "react";
import { Card, DatePicker, message, Spin } from "antd";
// Corrected: Changed path alias to a relative path to resolve the module.
import axiosInstance from "@/lib/axiosInstance";
import dayjs from "dayjs";
import Chart from 'chart.js/auto';

export default function FclAttendanceChart() {
  const [chartData, setChartData] = useState<{ labels: string[]; data: number[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterDate, setFilterDate] = useState(dayjs());
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    const fetchChartData = async (date: dayjs.Dayjs) => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(`/fcl/weekly-stats?month=${date.month() + 1}&year=${date.year()}`);
        setChartData(response.data);
      } catch (error) {
        message.error("Failed to fetch chart data.");
      } finally {
        setLoading(false);
      }
    };

    fetchChartData(filterDate);
  }, [filterDate]);

  useEffect(() => {
    if (chartRef.current && chartData) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: chartData.labels,
            datasets: [{
              label: 'Total Kehadiran per Minggu',
              data: chartData.data,
              backgroundColor: 'rgba(54, 162, 235, 0.6)',
              borderColor: 'rgba(54, 162, 235, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                    stepSize: 1
                }
              }
            }
          }
        });
      }
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [chartData]);

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Weekly Attendance Chart</h3>
        <DatePicker picker="month" value={filterDate} onChange={(date) => date && setFilterDate(date)} />
      </div>
      <div style={{ height: '300px' }}>
        {loading ? <div className="flex items-center justify-center h-full"><Spin /></div> : <canvas ref={chartRef}></canvas>}
      </div>
    </Card>
  );
}
