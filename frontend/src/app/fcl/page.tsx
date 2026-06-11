"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button, DatePicker, Form, Input, Typography, message } from "antd";
import { PlusOutlined, SearchOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/id";

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
import { PERMISSIONS } from "@/types";
import type { Member, AddMemberFormValues } from "@/types";

dayjs.locale("id");

const { Title, Text } = Typography;

export default function FclPage() {
  const { user } = useAuth();
  const { hasPermission, isAdmin } = useRoleAccess();
  const canViewFcl = hasPermission(PERMISSIONS.FCL_VIEW);
  const canManageMembers = hasPermission(PERMISSIONS.FCL_MANAGE_MEMBERS);
  const canTakeAttendance = hasPermission(PERMISSIONS.ATTENDANCE_MANAGE);
  const addMemberModal = useModal("fcl-add-member");
  const attendanceModal = useModal("fcl-attendance");
  const deleteModal = useModal("fcl-delete");

  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState("");
  const [statsDate, setStatsDate] = useState(dayjs());
  const [memberToDelete, setMemberToDelete] = useState<Member | null>(null);

  const fetchMembers = useCallback(async (): Promise<Member[]> => {
    const [membersRes, statsRes] = await Promise.all([
      fclService.getMyMembers(),
      attendanceService.getSingleAttendance(statsDate.month() + 1, statsDate.year()),
    ]);
    const stats = statsRes.data.memberStats;
    return membersRes.data.map((m) => {
      const s = stats.find((st) => st.memberId === m.id);
      return { ...m, presentCount: s?.presentCount ?? 0, absentCount: s?.absentCount ?? 0 };
    });
  }, [statsDate]);

  const { data: members, loading, refresh } = useTableData(fetchMembers);

  const filteredMembers = useMemo(
    () => members.filter((m) => m.name.toLowerCase().includes(searchText.toLowerCase())),
    [members, searchText]
  );

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
    { title: "Name", dataIndex: "name", key: "name", sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: "Date of Birth", dataIndex: "dob", key: "dob", sorter: (a, b) => dayjs(a.dob).diff(dayjs(b.dob)) },
    { title: "Present", dataIndex: "presentCount", key: "presentCount", sorter: (a, b) => (a.presentCount ?? 0) - (b.presentCount ?? 0) },
    { title: "Absent", dataIndex: "absentCount", key: "absentCount", sorter: (a, b) => (a.absentCount ?? 0) - (b.absentCount ?? 0) },
    ...(canManageMembers
      ? [
          {
            title: "Action" as const, key: "action", fixed: "right" as const, align: "center" as const, width: 120,
            render: (_: unknown, record: Member) => (
              <Button danger icon={<DeleteOutlined />} onClick={() => {
                setMemberToDelete(record);
                deleteModal.open();
              }} />
            ),
          },
        ]
      : []),
  ];

  if (!canViewFcl) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[50vh]">
        <Text type="secondary">You don&apos;t have permission to access this page.</Text>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div>
          <Title level={2} className="mb-0">FCL Management</Title>
          <Text strong>Name: {user?.username}</Text>
          {!isAdmin && (
            <div className="flex flex-col">
              <Text strong>Grade: {user?.grade}</Text>
              <Text strong>Gender: {user?.gender}</Text>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <DatePicker picker="month" value={statsDate} onChange={(d) => d && setStatsDate(d)} className="w-full" />
          <Input placeholder="Search Member" prefix={<SearchOutlined />} value={searchText} onChange={(e) => setSearchText(e.target.value)} />
          {canTakeAttendance && (
            <Button onClick={attendanceModal.open}>Take Attendance</Button>
          )}
          {canManageMembers && (
            <Button type="primary" icon={<PlusOutlined />} onClick={addMemberModal.open}>Add Member</Button>
          )}
        </div>
      </div>

      <DataTable columns={columns} dataSource={filteredMembers} loading={loading} rowKey="id" />

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
    </div>
  );
}
