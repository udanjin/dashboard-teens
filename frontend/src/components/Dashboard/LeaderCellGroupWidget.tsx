"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  Table,
  Button,
  Tag,
  Avatar,
  Progress,
  Skeleton,
  Empty,
  DatePicker,
  Space,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ArrowRightOutlined,
  UserOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import dayjs, { type Dayjs } from "dayjs";
import { fclService, attendanceService } from "@/services";
import { useAuth } from "@/context/AuthContext";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { PERMISSIONS } from "@/types";
import type { Member } from "@/types";

export default function LeaderCellGroupWidget() {
  const { user } = useAuth();
  const { hasPermission } = useRoleAccess();
  const canTakeAttendance = hasPermission(PERMISSIONS.ATTENDANCE_MANAGE);

  const [filterDate, setFilterDate] = useState<Dayjs>(dayjs());
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchGroupData = async () => {
      setLoading(true);
      try {
        const [membersRes, statsRes] = await Promise.all([
          fclService.getMyMembers(),
          attendanceService.getSingleAttendance(
            filterDate.month() + 1,
            filterDate.year()
          ),
        ]);

        if (isMounted) {
          const stats = statsRes.data?.memberStats || [];
          const combined = (membersRes.data || []).map((m) => {
            const s = stats.find((st) => st.memberId === m.id);
            return {
              ...m,
              presentCount: s?.presentCount ?? 0,
              absentCount: s?.absentCount ?? 0,
            };
          });
          setMembers(combined);
        }
      } catch (err) {
        console.error("Failed to load leader cell group", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchGroupData();

    return () => {
      isMounted = false;
    };
  }, [filterDate]);

  // Aggregate stats
  const totalMembers = members.length;
  const totalPresent = members.reduce((sum, m) => sum + (m.presentCount || 0), 0);
  const totalAbsent = members.reduce((sum, m) => sum + (m.absentCount || 0), 0);
  const totalSessions = totalPresent + totalAbsent;
  const groupRate =
    totalSessions > 0 ? Math.round((totalPresent / totalSessions) * 100) : 0;

  const columns: ColumnsType<Member> = [
    {
      title: "Member Name",
      dataIndex: "name",
      key: "name",
      render: (name: string) => (
        <div className="flex items-center gap-2">
          <Avatar size="small" className="bg-blue-100 text-blue-600 font-semibold text-xs">
            {name ? name.charAt(0).toUpperCase() : <UserOutlined />}
          </Avatar>
          <span className="font-medium text-gray-800 text-xs sm:text-sm">{name}</span>
        </div>
      ),
    },
    {
      title: "Present",
      dataIndex: "presentCount",
      key: "presentCount",
      align: "center",
      render: (val: number) => (
        <span className="font-bold text-emerald-600 text-xs sm:text-sm">
          {val}
        </span>
      ),
    },
    {
      title: "Absent",
      dataIndex: "absentCount",
      key: "absentCount",
      align: "center",
      render: (val: number) => (
        <span className="font-medium text-rose-500 text-xs sm:text-sm">
          {val}
        </span>
      ),
    },
    {
      title: "Rate",
      key: "rate",
      width: 110,
      render: (_, r) => {
        const total = (r.presentCount || 0) + (r.absentCount || 0);
        const rate = total > 0 ? Math.round((r.presentCount / total) * 100) : 0;
        return (
          <Progress
            percent={rate}
            size="small"
            status={rate >= 75 ? "success" : rate >= 50 ? "normal" : "exception"}
            format={(p) => `${p}%`}
          />
        );
      },
    },
  ];

  return (
    <Card
      bordered={false}
      className="shadow-sm hover:shadow-md transition-shadow rounded-xl border border-gray-100 mb-6"
      title={
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg text-base">
            <TeamOutlined />
          </div>
          <div>
            <span className="font-semibold text-gray-800 text-base">My Cell Group Overview</span>
            <p className="text-xs font-normal text-gray-400">
              {user?.grade ? `Grade ${user.grade}` : "Youth"}{" "}
              {user?.gender ? `• ${user.gender}` : ""} Group
            </p>
          </div>
        </div>
      }
      extra={
        <DatePicker
          picker="month"
          value={filterDate}
          allowClear={false}
          onChange={(date) => date && setFilterDate(date)}
          className="rounded-lg text-xs"
        />
      }
    >
      {/* Top Group Stats Strip */}
      <div className="grid grid-cols-4 gap-2 sm:gap-4 mb-4 p-3 bg-gray-50/80 rounded-xl border border-gray-100 text-center">
        <div>
          <span className="text-[11px] text-gray-400 uppercase font-medium">Members</span>
          <p className="text-base sm:text-lg font-bold text-gray-800 m-0">{totalMembers}</p>
        </div>
        <div className="border-l border-gray-200">
          <span className="text-[11px] text-emerald-600 uppercase font-medium">Present</span>
          <p className="text-base sm:text-lg font-bold text-emerald-600 m-0">{totalPresent}</p>
        </div>
        <div className="border-l border-gray-200">
          <span className="text-[11px] text-rose-600 uppercase font-medium">Absent</span>
          <p className="text-base sm:text-lg font-bold text-rose-600 m-0">{totalAbsent}</p>
        </div>
        <div className="border-l border-gray-200">
          <span className="text-[11px] text-blue-600 uppercase font-medium">Group Rate</span>
          <p className="text-base sm:text-lg font-bold text-blue-600 m-0">{groupRate}%</p>
        </div>
      </div>

      {/* Members Table */}
      {loading ? (
        <Skeleton active paragraph={{ rows: 4 }} />
      ) : members.length === 0 ? (
        <div className="py-6">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="No members found in your cell group yet."
          >
            <Link href="/fcl">
              <Button type="primary" size="small" icon={<PlusOutlined />}>
                Add Members
              </Button>
            </Link>
          </Empty>
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={members.slice(0, 6)}
          rowKey="id"
          pagination={false}
          size="small"
        />
      )}

      {/* Footer Navigation */}
      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">
          Showing top members for {filterDate.format("MMMM YYYY")}
        </span>
        <div className="flex items-center gap-2">
          {canTakeAttendance && (
            <Link href="/fcl">
              <Button size="small" type="primary" className="text-xs">
                Record Attendance
              </Button>
            </Link>
          )}
          <Link href="/fcl">
            <Button
              type="link"
              size="small"
              className="text-xs text-blue-600 font-medium hover:text-blue-700 p-0 flex items-center gap-1"
            >
              <span>Manage Group</span>
              <ArrowRightOutlined className="text-[10px]" />
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
