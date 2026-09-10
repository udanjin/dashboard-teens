"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  Table,
  Button,
  Modal,
  Typography,
  DatePicker,
  Select,
  Input,
  Space,
  Card,
  Tag,
  Avatar,
  Progress,
  Row,
  Col,
  Statistic,
  Breadcrumb,
  Empty,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  SearchOutlined,
  EyeOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  FilterOutlined,
  ArrowLeftOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import dayjs, { type Dayjs } from "dayjs";
import { fclService } from "@/services";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useAuth } from "@/context/AuthContext";
import { PERMISSIONS } from "@/types";
import type { LeaderSummary, MemberStat } from "@/types";

const { Title, Text } = Typography;

interface ProcessedLeader extends LeaderSummary {
  totalMembers: number;
  presentCount: number;
  absentCount: number;
  attendanceRate: number;
}

export default function FclLeadersSummaryPage() {
  const { user } = useAuth();
  const { hasPermission } = useRoleAccess();
  const canViewSummary =
    hasPermission(PERMISSIONS.FCL_VIEW_SUMMARY) ||
    hasPermission(PERMISSIONS.FCL_VIEW);

  const [filterDate, setFilterDate] = useState<Dayjs>(dayjs());
  const [summaryData, setSummaryData] = useState<LeaderSummary[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchText, setSearchText] = useState("");
  const [selectedGender, setSelectedGender] = useState<string>("All");
  const [selectedGrade, setSelectedGrade] = useState<number | "All">("All");

  // Modal State
  const [selectedLeader, setSelectedLeader] = useState<ProcessedLeader | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fclService.getSummary(
        filterDate.month() + 1,
        filterDate.year()
      );
      setSummaryData(res.data || []);
    } catch {
      message.error("Failed to fetch FCL leaders summary data.");
    } finally {
      setLoading(false);
    }
  }, [filterDate]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Process leader data with calculated stats
  const processedLeaders: ProcessedLeader[] = useMemo(() => {
    return summaryData.map((leader) => {
      const members = leader.members || [];
      const totalMembers = members.length;
      const presentCount = members.reduce(
        (sum, m) => sum + (m.presentCount || 0),
        0
      );
      const absentCount = members.reduce(
        (sum, m) => sum + (m.absentCount || 0),
        0
      );
      const totalSessions = presentCount + absentCount;
      const attendanceRate =
        totalSessions > 0
          ? Math.round((presentCount / totalSessions) * 100)
          : 0;

      return {
        ...leader,
        totalMembers,
        presentCount,
        absentCount,
        attendanceRate,
      };
    });
  }, [summaryData]);

  // Filtered leaders
  const filteredLeaders = useMemo(() => {
    return processedLeaders.filter((leader) => {
      const matchesSearch = leader.leaderName
        .toLowerCase()
        .includes(searchText.toLowerCase());

      const matchesGender =
        selectedGender === "All" ||
        leader.gender?.toLowerCase() === selectedGender.toLowerCase() ||
        (selectedGender === "Male" && leader.gender === "Laki-laki") ||
        (selectedGender === "Female" && leader.gender === "Perempuan");

      const matchesGrade =
        selectedGrade === "All" || leader.grade === selectedGrade;

      return matchesSearch && matchesGender && matchesGrade;
    });
  }, [processedLeaders, searchText, selectedGender, selectedGrade]);

  // Aggregate stats across all leaders
  const aggregateStats = useMemo(() => {
    const totalLeaders = processedLeaders.length;
    const totalTeens = processedLeaders.reduce(
      (sum, l) => sum + l.totalMembers,
      0
    );
    const totalPresent = processedLeaders.reduce(
      (sum, l) => sum + l.presentCount,
      0
    );
    const totalAbsent = processedLeaders.reduce(
      (sum, l) => sum + l.absentCount,
      0
    );
    const totalRecords = totalPresent + totalAbsent;
    const overallRate =
      totalRecords > 0
        ? ((totalPresent / totalRecords) * 100).toFixed(1)
        : "0";

    return {
      totalLeaders,
      totalTeens,
      totalPresent,
      totalAbsent,
      overallRate,
    };
  }, [processedLeaders]);

  const handleResetFilters = () => {
    setSearchText("");
    setSelectedGender("All");
    setSelectedGrade("All");
  };

  const leaderColumns: ColumnsType<ProcessedLeader> = [
    {
      title: "Leader's Name",
      dataIndex: "leaderName",
      key: "leaderName",
      sorter: (a, b) => a.leaderName.localeCompare(b.leaderName),
      render: (name: string, record) => (
        <div className="flex items-center gap-3">
          <Avatar
            className={
              record.gender === "Perempuan" || record.gender?.toLowerCase() === "female"
                ? "bg-pink-100 text-pink-600 font-semibold"
                : "bg-blue-100 text-blue-600 font-semibold"
            }
          >
            {name ? name.charAt(0).toUpperCase() : <UserOutlined />}
          </Avatar>
          <div>
            <span className="font-semibold text-gray-800 block text-sm">{name}</span>
            <span className="text-xs text-gray-400">ID: #{record.leaderId}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Class",
      dataIndex: "grade",
      key: "grade",
      sorter: (a, b) => (a.grade || 0) - (b.grade || 0),
      render: (grade: number) =>
        grade ? (
          <Tag color="geekblue" className="font-medium rounded-md">
            Grade {grade}
          </Tag>
        ) : (
          <Tag color="default">N/A</Tag>
        ),
    },
    {
      title: "Gender",
      dataIndex: "gender",
      key: "gender",
      filters: [
        { text: "Male / Laki-laki", value: "Male" },
        { text: "Female / Perempuan", value: "Female" },
      ],
      onFilter: (value, record) =>
        value === "Male"
          ? record.gender === "Laki-laki" || record.gender === "Male"
          : record.gender === "Perempuan" || record.gender === "Female",
      render: (gender: string) => {
        const isFemale =
          gender?.toLowerCase() === "female" || gender === "Perempuan";
        return (
          <Tag
            color={isFemale ? "pink" : "blue"}
            className="font-medium rounded-md"
          >
            {isFemale ? "Female" : "Male"}
          </Tag>
        );
      },
    },
    {
      title: "Members Count",
      dataIndex: "totalMembers",
      key: "totalMembers",
      sorter: (a, b) => a.totalMembers - b.totalMembers,
      render: (count: number) => (
        <div className="flex items-center gap-1.5 font-semibold text-gray-700">
          <TeamOutlined className="text-purple-500" />
          <span>{count} Members</span>
        </div>
      ),
    },
    {
      title: "Present Count",
      dataIndex: "presentCount",
      key: "presentCount",
      sorter: (a, b) => a.presentCount - b.presentCount,
      render: (val: number) => (
        <div className="flex items-center gap-1.5 font-bold text-emerald-600">
          <CheckCircleOutlined className="text-emerald-500" />
          <span>{val}</span>
        </div>
      ),
    },
    {
      title: "Absence Count",
      dataIndex: "absentCount",
      key: "absentCount",
      sorter: (a, b) => a.absentCount - b.absentCount,
      render: (val: number) => (
        <div className="flex items-center gap-1.5 font-semibold text-rose-500">
          <CloseCircleOutlined className="text-rose-400" />
          <span>{val}</span>
        </div>
      ),
    },
    {
      title: "Attendance Rate",
      dataIndex: "attendanceRate",
      key: "attendanceRate",
      sorter: (a, b) => a.attendanceRate - b.attendanceRate,
      render: (rate: number) => (
        <div className="w-32">
          <Progress
            percent={rate}
            size="small"
            status={rate >= 75 ? "success" : rate >= 50 ? "normal" : "exception"}
            format={(pct) => `${pct}%`}
          />
        </div>
      ),
    },
    {
      title: "Action",
      key: "action",
      align: "center",
      render: (_, record) => (
        <Button
          type="primary"
          ghost
          icon={<EyeOutlined />}
          size="small"
          className="rounded-md font-medium"
          onClick={() => {
            setSelectedLeader(record);
            setIsModalOpen(true);
          }}
        >
          View Members
        </Button>
      ),
    },
  ];

  const memberDetailColumns: ColumnsType<MemberStat> = [
    {
      title: "Member Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string) => (
        <span className="font-semibold text-gray-800">{name}</span>
      ),
    },
    {
      title: "Date of Birth",
      dataIndex: "dob",
      key: "dob",
      render: (dob: string) =>
        dob ? dayjs(dob).format("MMMM D, YYYY") : "—",
    },
    {
      title: "Phone Number",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      render: (phone: string) => phone || "—",
    },
    {
      title: "Present",
      dataIndex: "presentCount",
      key: "presentCount",
      align: "center",
      sorter: (a, b) => a.presentCount - b.presentCount,
      render: (val: number) => (
        <Tag color="success" className="font-bold px-2 py-0.5">
          {val}
        </Tag>
      ),
    },
    {
      title: "Absent",
      dataIndex: "absentCount",
      key: "absentCount",
      align: "center",
      sorter: (a, b) => a.absentCount - b.absentCount,
      render: (val: number) => (
        <Tag color="error" className="font-semibold px-2 py-0.5">
          {val}
        </Tag>
      ),
    },
    {
      title: "Rate",
      key: "rate",
      align: "center",
      render: (_, record) => {
        const total = (record.presentCount || 0) + (record.absentCount || 0);
        const rate = total > 0 ? Math.round((record.presentCount / total) * 100) : 0;
        return (
          <span className={`font-semibold ${rate >= 75 ? "text-emerald-600" : rate >= 50 ? "text-amber-600" : "text-red-500"}`}>
            {total > 0 ? `${rate}%` : "—"}
          </span>
        );
      },
    },
  ];

  if (!canViewSummary) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Title level={4} className="text-gray-700">Access Restricted</Title>
        <Text type="secondary" className="max-w-md mb-4">
          You do not have permission to view the all leaders summary page.
        </Text>
        <Link href="/dashboard">
          <Button type="primary" icon={<ArrowLeftOutlined />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Navigation Breadcrumb & Back Links */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <Breadcrumb
          items={[
            { title: <Link href="/dashboard">Home</Link> },
            { title: <Link href="/fcl">FCL</Link> },
            { title: "Leaders Summary" },
          ]}
        />
        <Space wrap>
          <Link href="/fcl">
            <Button icon={<TeamOutlined />}>My Cell Group</Button>
          </Link>
          <Link href="/dashboard">
            <Button icon={<ArrowLeftOutlined />}>Back to Dashboard</Button>
          </Link>
        </Space>
      </div>

      {/* Header Banner */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <Title level={2} className="!mb-1 text-gray-800">
            FCL Leaders Attendance Summary
          </Title>
          <Text type="secondary" className="text-sm">
            Monthly overview of all cell group leaders, their member rosters, and attendance performance.
          </Text>
        </div>

        {/* Month Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500 uppercase">Period:</span>
          <DatePicker
            picker="month"
            value={filterDate}
            allowClear={false}
            onChange={(date) => date && setFilterDate(date)}
            className="w-44 rounded-lg shadow-sm"
          />
          <Button
            icon={<ReloadOutlined />}
            onClick={fetchSummary}
            loading={loading}
            title="Refresh data"
          />
        </div>
      </div>

      {/* Top Aggregate KPI Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6} lg={4}>
          <Card bordered={false} className="shadow-sm rounded-xl border border-gray-100">
            <Statistic
              title={<span className="text-xs text-gray-400 uppercase font-medium">Total Leaders</span>}
              value={aggregateStats.totalLeaders}
              prefix={<UserOutlined className="text-blue-500 mr-1" />}
              valueStyle={{ fontSize: "1.75rem", fontWeight: "bold" }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={5}>
          <Card bordered={false} className="shadow-sm rounded-xl border border-gray-100">
            <Statistic
              title={<span className="text-xs text-gray-400 uppercase font-medium">Total Teens Members</span>}
              value={aggregateStats.totalTeens}
              prefix={<TeamOutlined className="text-purple-500 mr-1" />}
              valueStyle={{ fontSize: "1.75rem", fontWeight: "bold" }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={5}>
          <Card bordered={false} className="shadow-sm rounded-xl border border-gray-100">
            <Statistic
              title={<span className="text-xs text-emerald-600 uppercase font-medium">Total Present</span>}
              value={aggregateStats.totalPresent}
              valueStyle={{ color: "#10b981", fontSize: "1.75rem", fontWeight: "bold" }}
              prefix={<CheckCircleOutlined className="mr-1" />}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={5}>
          <Card bordered={false} className="shadow-sm rounded-xl border border-gray-100">
            <Statistic
              title={<span className="text-xs text-rose-600 uppercase font-medium">Total Absent</span>}
              value={aggregateStats.totalAbsent}
              valueStyle={{ color: "#ef4444", fontSize: "1.75rem", fontWeight: "bold" }}
              prefix={<CloseCircleOutlined className="mr-1" />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={5}>
          <Card bordered={false} className="shadow-sm rounded-xl border border-gray-100">
            <Statistic
              title={<span className="text-xs text-blue-600 uppercase font-medium">Attendance Rate</span>}
              value={aggregateStats.overallRate}
              suffix="%"
              valueStyle={{ color: "#2563eb", fontSize: "1.75rem", fontWeight: "bold" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Table Card */}
      <Card
        bordered={false}
        className="shadow-sm rounded-xl border border-gray-100"
        title={
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg text-base">
              <TeamOutlined />
            </div>
            <div>
              <span className="font-semibold text-gray-800 text-base">Leader Performance List</span>
              <p className="text-xs font-normal text-gray-400">
                Period: {filterDate.format("MMMM YYYY")} ({filteredLeaders.length} leaders shown)
              </p>
            </div>
          </div>
        }
      >
        {/* Filter Controls Row */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-5 p-3.5 bg-gray-50/70 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <Input
              placeholder="Search leader's name..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              className="w-full sm:w-60 rounded-lg"
            />

            <Select
              value={selectedGrade}
              onChange={(val) => setSelectedGrade(val)}
              className="w-36"
              options={[
                { value: "All", label: "All Classes" },
                { value: 7, label: "Grade 7" },
                { value: 8, label: "Grade 8" },
                { value: 9, label: "Grade 9" },
                { value: 10, label: "Grade 10" },
                { value: 11, label: "Grade 11" },
                { value: 12, label: "Grade 12" },
              ]}
            />

            <Select
              value={selectedGender}
              onChange={(val) => setSelectedGender(val)}
              className="w-36"
              options={[
                { value: "All", label: "All Genders" },
                { value: "Male", label: "Male" },
                { value: "Female", label: "Female" },
              ]}
            />

            {(searchText || selectedGender !== "All" || selectedGrade !== "All") && (
              <Button type="text" onClick={handleResetFilters} className="text-xs text-gray-500">
                Reset Filters
              </Button>
            )}
          </div>
        </div>

        {/* Leaders Table */}
        <div className="overflow-x-auto">
          <Table
            columns={leaderColumns}
            dataSource={filteredLeaders}
            loading={loading}
            rowKey="leaderId"
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ["10", "20", "50"],
              showTotal: (total) => `Total ${total} leaders`,
            }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description="No leader records found for the selected filters."
                />
              ),
            }}
          />
        </div>
      </Card>

      {/* Member Details Modal */}
      <Modal
        title={
          <div className="flex items-center gap-3 text-base font-semibold text-gray-800">
            <Avatar className="bg-blue-600 text-white font-bold">
              {selectedLeader?.leaderName?.charAt(0).toUpperCase()}
            </Avatar>
            <div>
              <span>{selectedLeader?.leaderName}&apos;s Cell Group Members</span>
              <p className="text-xs font-normal text-gray-400">
                Grade {selectedLeader?.grade ?? "N/A"} • {selectedLeader?.gender} • {selectedLeader?.totalMembers} Members
              </p>
            </div>
          </div>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={[
          <Button key="close" type="primary" onClick={() => setIsModalOpen(false)}>
            Close
          </Button>,
        ]}
        width={850}
        centered
      >
        <div className="my-4">
          {/* Group Stats Strip inside Modal */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-gray-50 rounded-xl mb-4 border border-gray-100">
            <div>
              <span className="text-xs text-gray-400 uppercase font-medium">Total Members</span>
              <p className="text-lg font-bold text-gray-800 m-0">{selectedLeader?.totalMembers || 0}</p>
            </div>
            <div>
              <span className="text-xs text-emerald-600 uppercase font-medium">Total Present</span>
              <p className="text-lg font-bold text-emerald-600 m-0">{selectedLeader?.presentCount || 0}</p>
            </div>
            <div>
              <span className="text-xs text-rose-600 uppercase font-medium">Total Absent</span>
              <p className="text-lg font-bold text-rose-600 m-0">{selectedLeader?.absentCount || 0}</p>
            </div>
          </div>

          <Table
            columns={memberDetailColumns}
            dataSource={selectedLeader?.members || []}
            rowKey="id"
            pagination={false}
            scroll={{ x: 600 }}
            size="small"
            locale={{
              emptyText: <Empty description="No members assigned to this leader yet." />,
            }}
          />
        </div>
      </Modal>
    </div>
  );
}
