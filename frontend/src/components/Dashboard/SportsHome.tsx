"use client";

import { useState, useEffect } from "react";
import { Card, Statistic, Spin, Typography, message } from "antd";
import { WalletOutlined } from "@ant-design/icons";
// Corrected: Changed path alias to a relative path to resolve the module.
import axiosInstance from "@/lib/axiosInstance";

export default function SportsHome() {
  const [cashBalance, setCashBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCashBalance = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/sport-reports/cash-balance");
        setCashBalance(response.data);
      } catch (error) {
        message.error("Failed to fetch cash balance.");
        console.error("Failed to fetch cash balance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCashBalance();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-10">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Card bordered={false} className="shadow-md">
      <Statistic
        title="Total Uang Kas Sports"
        value={cashBalance !== null ? cashBalance : 0}
        precision={0}
        valueStyle={{ 
          color: (cashBalance ?? 0) >= 0 ? '#3f8600' : '#cf1322',
          fontSize: '2rem' 
        }}
        prefix="Rp"
        formatter={(value) => Number(value).toLocaleString("id-ID")}
      />
    </Card>
  );
}
