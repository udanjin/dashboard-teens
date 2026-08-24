"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Button, DatePicker, Form, Input, Typography, message } from "antd";
import { PlusOutlined, SearchOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/id";

import { useAuth } from "@/context/AuthContext";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useModal } from "@/stores/modalStore";
import { fclService, attendanceService } from "@/services";
import { useTableData } from "@/hooks/useTableData";
import DataTable from "@/components/Common/DataTable";
import GlobalFormModal from "@/components/Common/GlobalFormModal";
import AddMemberForm from "@/components/FCL/AddMemberForm";
import AttendanceModal from "@/components/FCL/AttendanceModal";
import DeleteMemberModal from "@/components/FCL/DeleteMemberModal";
import EditMemberModal, { EDIT_MEMBER_MODAL_KEY } from "@/components/FCL/EditMemberModal";
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
    { title: "Name", dataIndex: "name", key: "name", sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: "Date of Birth", dataIndex: "dob", key: "dob", sorter: (a, b) => dayjs(a.dob).diff(dayjs(b.dob)) },
    { title: "Phone Number", dataIndex: "phoneNumber", key: "phoneNumber", },
    { title: "Present", dataIndex: "presentCount", key: "presentCount", sorter: (a, b) => (a.presentCount ?? 0) - (b.presentCount ?? 0) },
    { title: "Absent", dataIndex: "absentCount", key: "absentCount", sorter: (a, b) => (a.absentCount ?? 0) - (b.absentCount ?? 0) },
    ...(canManageMembers
      ? [
        {
          title: "Action" as const, key: "action", fixed: "right" as const, align: "center" as const, width: 100,
          render: (_: unknown, record: Member) => (
            <div className="flex gap-2 justify-center">
              <Button
                icon={<EditOutlined />}
                size="small"
                onClick={() => {
                  setMemberToEdit(record);
                  editModal.open();
                }}
              />
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={() => {
                  setMemberToDelete(record);
                  deleteModal.open();
                }}
              />
            </div>
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
    <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center mb-8 gap-6 border-b border-zinc-800/50 pb-6">
        <div className="space-y-1">
          <Title level={2} className="!mb-0 !font-bold tracking-tight">FCL Management</Title>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-400 text-sm">
            <Text className="text-gray-400">Leader: <span className="text-gray-200">{user?.username}</span></Text>
          {!isAdmin && (
            <>
              <Text className="hidden sm:inline text-gray-600">•</Text>
              <Text className="text-gray-400">Grade: <span className="text-gray-200">{user?.grade}</span></Text>
              <Text className="hidden sm:inline text-gray-600">•</Text>
              <Text className="text-gray-400">Gender: <span className="text-gray-200">{user?.gender}</span></Text>
            </>
          )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <DatePicker picker="month" value={statsDate} onChange={(d) => d && setStatsDate(d)} className="w-full sm:w-36 shrink-0" />
          <Input placeholder="Search Member" prefix={<SearchOutlined className="text-gray-400" />} value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-full sm:w-48 shrink-0" />
          <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            {canTakeAttendance && (
              <Button onClick={attendanceModal.open} className="flex-1 sm:flex-none justify-center">Take Attendance</Button>
            )}
            {canManageMembers && (
              <Button type="primary" icon={<PlusOutlined />} onClick={addMemberModal.open} className="flex-1 sm:flex-none justify-center bg-violet-600 hover:bg-violet-500 border-none">Add Member</Button>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#121212] rounded-xl border border-zinc-800/50 overflow-hidden shadow-2xl">
        <DataTable columns={columns} dataSource={filteredMembers} loading={loading} rowKey="id" scroll={{ x: 'max-content' }} />
      </div>

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
