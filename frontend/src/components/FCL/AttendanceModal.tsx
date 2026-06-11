"use client";

import React, { useState, useCallback } from "react";
import { Modal, Table, Button, DatePicker, Typography, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { fclService, attendanceService } from "@/services";
import { getSundaysOfMonth } from "@/lib/formatters";
import dayjs, { type Dayjs } from "dayjs";
import type { AttendanceRecord } from "@/types";

const { Text } = Typography;

function AttendanceButton({ status, onClick }: { status: number | null; onClick: () => void }) {
  const config: Record<number, { text: string; type: "primary" | "dashed"; danger: boolean }> = {
    0: { text: "Present", type: "primary", danger: false },
    1: { text: "Absent", type: "dashed", danger: true },
  };
  const c = status !== null ? config[status as number] : null;

  return (
    <Button onClick={onClick} type={c?.type ?? "default"} danger={c?.danger ?? false} size="small">
      {c?.text ?? "Unmarked"}
    </Button>
  );
}

interface AttendanceModalProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: () => void;
}

export default function AttendanceModal({ open, onClose, onSubmitted }: AttendanceModalProps) {
  const [date, setDate] = useState(dayjs());
  const [data, setData] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSheet = useCallback(async (d: Dayjs) => {
    setLoading(true);
    try {
      const membersRes = await fclService.getMyMembers();
      if (membersRes.data.length === 0) {
        setData([]);
        return;
      }
      const sundays = getSundaysOfMonth(d);
      const responses = await Promise.all(
        sundays.map((s) => attendanceService.getSheet(s.format("YYYY-MM-DD")))
      );
      setData(
        membersRes.data.map((member) => {
          const record: AttendanceRecord = { memberId: member.id, name: member.name };
          sundays.forEach((sunday, idx) => {
            const key = sunday.format("YYYY-MM-DD");
            const match = responses[idx].data.find((a) => a.memberId === member.id);
            record[key] = match ? match.status : null;
          });
          return record;
        })
      );
    } catch {
      message.error("Failed to fetch attendance sheet.");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpen = useCallback(() => {
    const today = dayjs();
    setDate(today);
    fetchSheet(today);
  }, [fetchSheet]);

  React.useEffect(() => {
    if (open) handleOpen();
  }, [open, handleOpen]);

  const handleChange = (memberId: number, dateKey: string) => {
    setData((prev) =>
      prev.map((r) => {
        if (r.memberId !== memberId) return r;
        const cur = r[dateKey] as number | null;
        let next: number | null = 0;
        if (cur === 0) next = 1;
        if (cur === 1) next = null;
        return { ...r, [dateKey]: next };
      })
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const grouped: Record<string, { memberId: number; status: number | null }[]> = {};
      for (const record of data) {
        for (const key of Object.keys(record)) {
          if (!key.startsWith("20")) continue;
          if (!grouped[key]) grouped[key] = [];
          grouped[key].push({ memberId: record.memberId as number, status: record[key] as number | null });
        }
      }
      await Promise.all(
        Object.entries(grouped).map(([d, attendances]) =>
          attendanceService.submit({ date: d, attendances })
        )
      );
      message.success("Attendance submitted successfully!");
      onClose();
      onSubmitted();
    } catch {
      message.error("Failed to submit attendance.");
    } finally {
      setLoading(false);
    }
  };

  const sundays = getSundaysOfMonth(date);
  const columns: ColumnsType<AttendanceRecord> = [
    { title: "Nama", dataIndex: "name", key: "name", fixed: "left", width: 150 },
    ...sundays.map((sunday) => {
      const key = sunday.format("YYYY-MM-DD");
      return {
        title: sunday.format("D MMM"),
        key,
        dataIndex: key,
        render: (_: unknown, record: AttendanceRecord) => (
          <AttendanceButton status={record[key] as number | null} onClick={() => handleChange(record.memberId as number, key)} />
        ),
        align: "center" as const,
      };
    }),
  ];

  return (
    <Modal
      title="Take Attendance"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      width={1000}
      confirmLoading={loading}
    >
      <div className="flex items-center gap-4 mb-4">
        <Text>Month:</Text>
        <DatePicker
          picker="month"
          value={date}
          onChange={(d) => {
            if (d) {
              setDate(d);
              fetchSheet(d);
            }
          }}
        />
      </div>
      <Table
        columns={columns}
        dataSource={data}
        rowKey="memberId"
        bordered
        pagination={false}
        scroll={{ x: "max-content" }}
        loading={loading}
      />
    </Modal>
  );
}
