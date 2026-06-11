"use client";

import { useState, useEffect } from "react";
import { Card, Statistic, Spin, message } from "antd";
import { sportsService } from "@/services";

export default function SportsHome() {
  const [cashBalance, setCashBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await sportsService.getCashBalance();
        setCashBalance(res.data);
      } catch {
        message.error("Failed to fetch cash balance.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
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
        value={cashBalance ?? 0}
        precision={0}
        valueStyle={{
          color: (cashBalance ?? 0) >= 0 ? "#3f8600" : "#cf1322",
          fontSize: "2rem",
        }}
        prefix="Rp"
        formatter={(value) => Number(value).toLocaleString("id-ID")}
      />
    </Card>
  );
}
