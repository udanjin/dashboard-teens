"use client";

import React, { useState, useEffect } from "react";
import { Modal, Table, Typography, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { attendanceService, type AttendanceHistoryEntry } from "@/services/attendance.service";
import dayjs from "dayjs";

const { Text } = Typography;

interface HistoryModalProps {
  open: boolean;
  memberId: number | null;
  date?: string | null;
  monthYear?: { month: number; year: number } | null;
  memberName: string;
  onClose: () => void;
}

export default function HistoryModal({ open, memberId, date, monthYear, memberName, onClose }: HistoryModalProps) {
  const [data, setData] = useState<AttendanceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && memberId) {
      setLoading(true);
      const fetchPromise = monthYear 
        ? attendanceService.getHistoryByMonth(memberId, monthYear.month, monthYear.year)
        : date 
          ? attendanceService.getHistory(memberId, date)
          : Promise.resolve({ data: [] });

      fetchPromise
        .then(res => setData(res.data))
        .catch(() => message.error("Failed to load history"))
        .finally(() => setLoading(false));
    } else {
      setData([]);
    }
  }, [open, memberId, date, monthYear]);

  const columns: ColumnsType<AttendanceHistoryEntry> = [
    ...(monthYear ? [{
      title: "Attendance Date",
      dataIndex: "date",
      key: "date",
      render: (d: string) => <Text strong>{dayjs(d).format("ddd, D MMM YYYY")}</Text>
    }] : []),
    {
      title: "Action",
      dataIndex: "action",
      key: "action",
      render: (action: string) => {
        const color = action === "Created" ? "green" : action === "Updated" ? "blue" : "red";
        return <Tag color={color}>{action}</Tag>;
      }
    },
    {
      title: "Previous Status",
      dataIndex: "oldStatus",
      key: "oldStatus",
      render: (status: number | null) => (
        <Text type="secondary">{status === 0 ? "Present" : status === 1 ? "Absent" : "Unmarked"}</Text>
      )
    },
    {
      title: "New Status",
      dataIndex: "newStatus",
      key: "newStatus",
      render: (status: number | null) => (
        <Text strong>{status === 0 ? "Present" : status === 1 ? "Absent" : "Unmarked"}</Text>
      )
    },
    {
      title: "Updated By",
      dataIndex: "Updater",
      key: "Updater",
      render: (updater) => updater ? updater.name || updater.username : "System"
    },
    {
      title: "Timestamp",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt: string) => dayjs(createdAt).format("DD MMM YYYY, HH:mm:ss")
    }
  ];

  const modalTitle = monthYear 
    ? `Attendance History for ${memberName} in ${dayjs().month(monthYear.month - 1).year(monthYear.year).format("MMM YYYY")}`
    : date 
      ? `Attendance History for ${memberName} on ${dayjs(date).format("D MMM YYYY")}`
      : `Attendance History for ${memberName}`;

  return (
    <Modal
      title={modalTitle}
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Table 
        columns={columns} 
        dataSource={data} 
        rowKey="id" 
        loading={loading}
        pagination={false}
        size="small"
      />
    </Modal>
  );
}
