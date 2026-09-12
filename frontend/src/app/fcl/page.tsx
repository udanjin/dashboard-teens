"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Button,
  DatePicker,
  Form,
  Input,
  Typography,
  message,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Avatar,
  Progress,
  Breadcrumb,
  Space,
} from "antd";
import {
  PlusOutlined,
  SearchOutlined,
  DeleteOutlined,
  EditOutlined,
  SolutionOutlined,
  TeamOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  ArrowLeftOutlined,
  CalendarOutlined,
  PhoneOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";

import { useAuth } from "@/context/AuthContext";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useModal } from "@/stores/modalStore";
import { fclService, attendanceService } from "@/services";
import { useTableData } from "@/components/Common/DataTable";
import DataTable from "@/components/Common/DataTable";
import GlobalFormModal from "@/components/Common/GlobalFormModal";
import AddMemberForm from "@/components/FCL/AddMemberForm";
import AttendanceModal from "@/components/FCL/AttendanceModal";
import DeleteMemberModal from "@/components/FCL/DeleteMemberModal";
import EditMemberModal, { EDIT_MEMBER_MODAL_KEY } from "@/components/FCL/EditMemberModal";
import { PERMISSIONS } from "@/types";
import type { Member, AddMemberFormValues } from "@/types";

const { Title, Text } = Typography;

export default function FclPage() {
  const { user } = useAuth();
  const { hasPermission, isAdmin } = useRoleAccess();
  const canViewFcl = hasPermission(PERMISSIONS.FCL_VIEW);
  const canViewSummary = hasPermission(PERMISSIONS.FCL_VIEW_SUMMARY);
  const canManageMembers = hasPermission(PERMISSIONS.FCL_MANAGE_MEMBERS);
  const canTakeAttendance = hasPermission(PERMISSIONS.ATTENDANCE_MANAGE);

  const addMemberModal = useModal("fcl-add-member");
  const attendanceModal = useModal("fcl-attendance");
  const deleteModal = useModal("fcl-delete");
  const editModal = useModal(EDIT_MEMBER_MODAL_KEY);

  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [statsDate, setStatsDate] = useState(dayjs());
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);
  const [memberToEdit, setMemberToEdit] = useState<Member | null>(null);

  const fetchMembers = useCallback(async (): Promise<Member[]> => {
    const [membersRes, statsRes] = await Promise.all([
      fclService.getMyMembers(),
      attendanceService.getSingleAttendance(statsDate.month() + 1, statsDate.year()),
    ]);
    const stats = statsRes.data.memberStats || [];
    return (membersRes.data || []).map((m) => {
      const s = stats.find((st) => st.memberId === m.id);
      return { ...m, presentCount: s?.presentCount ?? 0, absentCount: s?.absentCount ?? 0 };
    });
  }, [statsDate]);

  const { data: members, loading, refresh } = useTableData(fetchMembers);

  const filteredMembers = useMemo(
    () => members.filter((m) => m.name.toLowerCase().includes(searchText.toLowerCase())),
    [members, searchText]
  );

  // Group aggregate stats
  const groupStats = useMemo(() => {
    const total = members.length;
    const present = members.reduce((sum, m) => sum + (m.presentCount || 0), 0);
    const absent = members.reduce((sum, m) => sum + (m.absentCount || 0), 0);
    const totalSessions = present + absent;
    const rate = totalSessions > 0 ? ((present / totalSessions) * 100).toFixed(1) : "0";
    return { total, present, absent, rate };
  }, [members]);

  useEffect(() => {
    if (addMemberModal.isOpen && user) {
      form.setFieldsValue({ grade: user.grade, gender: user.gender, names: [{ name: "", dob: null }] });
    }
  }, [addMemberModal.isOpen, user, form]);

  const handleAddMember = async (values: AddMemberFormValues) => {
    if (!user?.grade || !user?.gender) {
      message.error("Your leader profile is incomplete. Cannot add new members.");
      return;
    }
    addMemberModal.setLoading(true);
    try {
      await fclService.addMembers(
        values.names.map((item) => ({
          name: item.name,
          dob: item.dob ? item.dob.format("YYYY-MM-DD") : null,
          grade: user.grade!,
          gender: user.gender!,
          phoneNumber: item.phoneNumber,
        }))
      );
      message.success("Members added successfully!");
      addMemberModal.close();
      form.resetFields();
      refresh();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: string } } };
      message.error(err.response?.data?.error ?? "Failed to add members.");
    } finally {
      addMemberModal.setLoading(false);
    }
  };

  const columns: ColumnsType<Member> = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string, record) => (
        <div className="flex items-center gap-3">
          <Avatar className="bg-blue-100 text-blue-600 font-semibold">
            {name ? name.charAt(0).toUpperCase() : <UserOutlined />}
          </Avatar>
          <div>
            <span className="font-semibold text-gray-800 block text-sm">{name}</span>
            <span className="text-xs text-gray-400">ID: #{record.id}</span>
          </div>
        </div>
      ),
    },
    {
      title: "Date of Birth",
      dataIndex: "dob",
      key: "dob",
      sorter: (a, b) => dayjs(a.dob).diff(dayjs(b.dob)),
      render: (dob: string | null | undefined) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <CalendarOutlined className="text-gray-400" />
          <span>{dob ? dayjs(dob).format("MMMM D, YYYY") : "—"}</span>
        </div>
      ),
    },
    {
      title: "Phone Number",
      dataIndex: "phoneNumber",
      key: "phoneNumber",
      render: (phone: string | undefined) => (
        <div className="flex items-center gap-1.5 text-xs text-gray-600">
          <PhoneOutlined className="text-gray-400" />
          <span>{phone || "—"}</span>
        </div>
      ),
    },
    {
      title: "Present",
      dataIndex: "presentCount",
      key: "presentCount",
      align: "center",
      sorter: (a, b) => a.presentCount - b.presentCount,
      render: (count: number) => (
        <Tag color="success" className="font-bold px-2 py-0.5">
          {count}
        </Tag>
      ),
    },
    {
      title: "Absent",
      dataIndex: "absentCount",
      key: "absentCount",
      align: "center",
      sorter: (a, b) => a.absentCount - b.absentCount,
      render: (count: number) => (
        <Tag color="error" className="font-semibold px-2 py-0.5">
          {count}
        </Tag>
      ),
    },
    {
      title: "Attendance Rate",
      key: "rate",
      width: 140,
      render: (_, record) => {
        const total = record.presentCount + record.absentCount;
        const rate = total > 0 ? Math.round((record.presentCount / total) * 100) : 0;
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
    ...(canManageMembers
      ? [
        {
          title: "Action",
          key: "action",
          align: "center" as const,
          width: 110,
          render: (_: unknown, record: Member) => (
            <div className="flex items-center justify-center gap-1.5">
              <Button
                type="text"
                icon={<EditOutlined className="text-blue-500" />}
                size="small"
                onClick={() => {
                  setMemberToEdit(record);
                  editModal.open();
                }}
                title="Edit member"
              />
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={() => {
                  setMemberToDelete(record);
                  deleteModal.open();
                }}
                title="Request delete"
              />
            </div>
          ),
        },
      ]
      : []),
  ];

  if (!canViewFcl) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Title level={4} className="text-gray-700">Access Restricted</Title>
        <Text type="secondary" className="max-w-md mb-4">
          You do not have permission to access the FCL management page.
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
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <Breadcrumb
          items={[
            { title: <Link href="/dashboard">Home</Link> },
            { title: "FCL" },
            { title: "My FC Group" },
          ]}
        />
        <Space wrap>
          {canViewSummary && (
            <Link href="/fcl/leaders">
              <Button icon={<SolutionOutlined />}>All Leaders Summary</Button>
            </Link>
          )}
          <Link href="/dashboard">
            <Button icon={<ArrowLeftOutlined />}>Back to Dashboard</Button>
          </Link>
        </Space>
      </div>

      {/* Header Banner */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <Title level={2} className="!mb-1 text-gray-800">
            FC Group Management
          </Title>
          <Text type="secondary" className="text-sm">
            Manage your FC group members, review monthly attendance, and record Sunday sessions.
          </Text>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Tag color="purple" className="rounded-full px-2.5 font-medium">
              Leader: {user?.name || user?.username}
            </Tag>
            {user?.grade && (
              <Tag color="geekblue" className="rounded-full px-2.5 font-medium">
                Grade {user.grade}
              </Tag>
            )}
            {user?.gender && (
              <Tag
                color={user.gender === "male" ? "blue" : "pink"}
                className="rounded-full px-2.5 font-medium"
              >
                {user.gender === "male" ? "Male Group" : "Female Group"}
              </Tag>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canTakeAttendance && (
            <Button
              type="primary"
              icon={<CheckCircleOutlined />}
              onClick={attendanceModal.open}
              className="bg-emerald-600 hover:!bg-emerald-700 h-10 px-4 rounded-lg font-semibold border-none shadow-sm flex items-center"
            >
              Take Attendance
            </Button>
          )}
          {canManageMembers && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={addMemberModal.open}
              className="h-10 px-4 rounded-lg font-semibold flex items-center"
            >
              Add Member
            </Button>
          )}
        </div>
      </div>

      {/* Group KPI Cards */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6} lg={6}>
          <Card bordered={false} className="shadow-sm rounded-xl h-full border border-gray-100">
            <Statistic
              title={<span className="text-xs text-gray-400 uppercase font-medium">Total Members</span>}
              value={groupStats.total}
              prefix={<TeamOutlined className="text-blue-500 mr-1" />}
              valueStyle={{ fontSize: "1.75rem", fontWeight: "bold" }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={6}>
          <Card bordered={false} className="shadow-sm rounded-xl h-full border border-gray-100">
            <Statistic
              title={<span className="text-xs text-emerald-600 uppercase font-medium">Present (This Month)</span>}
              value={groupStats.present}
              prefix={<CheckCircleOutlined className="mr-1" />}
              valueStyle={{ color: "#10b981", fontSize: "1.75rem", fontWeight: "bold" }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={6}>
          <Card bordered={false} className="shadow-sm rounded-xl h-full border border-gray-100">
            <Statistic
              title={<span className="text-xs text-rose-600 uppercase font-medium">Absent (This Month)</span>}
              value={groupStats.absent}
              prefix={<CloseCircleOutlined className="mr-1" />}
              valueStyle={{ color: "#ef4444", fontSize: "1.75rem", fontWeight: "bold" }}
            />
          </Card>
        </Col>

        <Col xs={12} sm={6} lg={6}>
          <Card bordered={false} className="shadow-sm rounded-xl h-full border border-gray-100">
            <Statistic
              title={<span className="text-xs text-blue-600 uppercase font-medium">Attendance Rate</span>}
              value={groupStats.rate}
              suffix="%"
              valueStyle={{ color: "#2563eb", fontSize: "1.75rem", fontWeight: "bold" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Main Members Table Card */}
      <Card
        bordered={false}
        className="shadow-sm rounded-xl border border-gray-100"
        title={
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg text-base">
              <TeamOutlined />
            </div>
            <div>
              <span className="font-semibold text-gray-800 text-base">FC Group Roster</span>
              <p className="text-xs font-normal text-gray-400">
                Period: {statsDate.format("MMMM YYYY")} ({filteredMembers.length} members)
              </p>
            </div>
          </div>
        }
      >
        {/* Table Toolbar / Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 p-3.5 bg-gray-50/70 rounded-xl border border-gray-100">
          <div className="flex items-center gap-2 flex-wrap flex-1">
            <Input
              placeholder="Search member name..."
              prefix={<SearchOutlined className="text-gray-400" />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              allowClear
              className="w-full sm:w-64 rounded-lg"
            />
            <DatePicker
              picker="month"
              value={statsDate}
              onChange={(d) => d && setStatsDate(d)}
              allowClear={false}
              className="w-40 rounded-lg"
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={refresh}
              loading={loading}
              title="Refresh member data"
            />
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <DataTable
            columns={columns}
            dataSource={filteredMembers}
            loading={loading}
            rowKey="id"
            pagination={{ pageSize: 15, showSizeChanger: true }}
            scroll={{ x: 800 }}
          />
        </div>
      </Card>

      {/* Modals */}
      <GlobalFormModal
        title="Add New Members"
        open={addMemberModal.isOpen}
        onCancel={() => { addMemberModal.close(); form.resetFields(); }}
        form={form}
        confirmLoading={addMemberModal.loading}
      >
        <AddMemberForm form={form} onFinish={handleAddMember} loading={addMemberModal.loading} />
      </GlobalFormModal>

      <AttendanceModal
        open={attendanceModal.isOpen}
        onClose={attendanceModal.close}
        onSubmitted={refresh}
      />

      <DeleteMemberModal
        member={memberToDelete}
        open={deleteModal.isOpen}
        onClose={() => { deleteModal.close(); setMemberToDelete(null); }}
        onDeleted={refresh}
      />

      <EditMemberModal
        member={memberToEdit}
        onSuccess={() => {
          setMemberToEdit(null);
          refresh();
        }}
      />
    </div>
  );
}
