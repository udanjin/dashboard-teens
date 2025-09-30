"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Badge, Card, Typography, message, Spin, Tooltip } from "antd";
import type { Dayjs } from "dayjs";
import axiosInstance from "@/lib/axiosInstance";
import dayjs from "dayjs";

const { Title } = Typography;

// Interface untuk mendefinisikan struktur data ulang tahun dari API
interface Birthday {
  date: string;
  name: string;
  type: "User" | "Member";
}

const BirthdayCalendar: React.FC = () => {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchBirthdays = async () => {
      setLoading(true);
      try {
        // Memanggil API yang sudah kita buat
        const response = await axiosInstance.get<Birthday[]>("fcl/birthdays");
        setBirthdays(response.data);
      } catch (error) {
        message.error("Failed to fetch birthday data.");
        console.error("Error fetching birthdays:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBirthdays();
  }, []);

  // Fungsi untuk mendapatkan data ulang tahun pada tanggal tertentu
  const getListData = (value: Dayjs): Birthday[] => {
    // Filter data ulang tahun berdasarkan bulan dan tanggal, mengabaikan tahun
    // Ini memastikan ulang tahun muncul setiap tahun
    const listData = birthdays.filter((item) => {
      const itemDate = dayjs(item.date);
      return (
        itemDate.month() === value.month() && itemDate.date() === value.date()
      );
    });
    return listData;
  };

  // Fungsi untuk merender tampilan sel di kalender
  const dateCellRender = (value: Dayjs) => {
    const listData = getListData(value);
    if (listData.length === 0) return null;

    return (
      <ul className="events" style={{ margin: 0, padding: 0, listStyle: "none" }}>
        {listData.map((item, index) => (
          <li key={index}>
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
      <Title level={3} className="mb-4">
        Birthday Calendar
      </Title>
      {loading ? (
        <div className="flex justify-center items-center h-[300px]">
          <Spin size="large" />
        </div>
      ) : (
        <Calendar dateCellRender={dateCellRender} />
      )}
    </Card>
  );
};

export default BirthdayCalendar;
