"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Badge, Card, Typography, message, Spin, Tooltip } from "antd";
import type { Dayjs } from "dayjs";
import { fclService } from "@/services";
import dayjs from "dayjs";
import type { Birthday } from "@/types";

const { Title } = Typography;

export default function BirthdayCalendar() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await fclService.getBirthdays();
        setBirthdays(res.data);
      } catch {
        message.error("Failed to fetch birthday data.");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const getListData = (value: Dayjs): Birthday[] =>
    birthdays.filter((item) => {
      const d = dayjs(item.date);
      return d.month() === value.month() && d.date() === value.date();
    });

  const dateCellRender = (value: Dayjs) => {
    const list = getListData(value);
    if (!list.length) return null;
    return (
      <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {list.map((item, i) => (
          <li key={i}>
            <Tooltip title={`${item.name} (${item.type})`}>
              <Badge status="success" text={item.name} />
            </Tooltip>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <Card bordered={false}>
      <Title level={3} className="mb-4">Birthday Calendar</Title>
      {loading ? (
        <div className="flex justify-center items-center h-[300px]"><Spin size="large" /></div>
      ) : (
        <Calendar dateCellRender={dateCellRender} />
      )}
    </Card>
  );
}
