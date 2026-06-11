"use client";

import { useState, useCallback, useEffect } from "react";
import { Button, Form, Tag, message, Space, Popconfirm, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { useModal } from "@/stores/modalStore";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { userService } from "@/services";
import { useTableData } from "@/components/Common/DataTable";
import DataTable from "@/components/Common/DataTable";
import GlobalFormModal from "@/components/Common/GlobalFormModal";
import DynamicForm, { type FieldConfig, type FieldOption } from "@/components/Common/DynamicForm";
import { formatDate } from "@/lib/formatters";
import { PERMISSIONS } from "@/types";
import type { PendingUser, Role } from "@/types";

const MODAL_KEY = "approval-form";

export default function AdminApprovalPage() {
  const { hasPermission } = useRoleAccess();
  const canAccessApproval = hasPermission(PERMISSIONS.APPROVAL_VIEW) || hasPermission(PERMISSIONS.APPROVAL_MANAGE);
  const canManageApproval = hasPermission(PERMISSIONS.APPROVAL_MANAGE);

  const [form] = Form.useForm<{ roleIds: number[] }>();
  const modal = useModal(MODAL_KEY);
  const [selectedUser, setSelectedUser] = useState<PendingUser | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

  const fetchUsers = useCallback(async () => {
    const res = await userService.getPendingUsers();
    return res.data;
  }, []);

  const { data, loading, refresh } = useTableData(fetchUsers);

  useEffect(() => {
    userService.getRoles().then((res) => setAvailableRoles(res.data)).catch(() => {});
  }, []);

  const roleOptions: FieldOption[] = availableRoles.map((r) => ({
    label: r.name.toUpperCase(),
    value: r.id,
  }));

  const approvalFields: FieldConfig[][] = [
    [
      {
        name: "roleIds",
        label: "Select one or more roles to assign:",
        componentType: "select",
        options: roleOptions,
        placeholder: "Please select roles",
        rules: [{ required: true, message: "Please assign at least one role." }],
        props: { mode: "multiple" as const, allowClear: true },
      },
    ],
  ];

  const handleApprove = async (values: { roleIds: number[] }) => {
    if (!selectedUser) return;
    modal.setLoading(true);
    try {
      await userService.approveUser(selectedUser.id, { roleIds: values.roleIds });
      message.success(`User ${selectedUser.username} has been approved.`);
      modal.close();
      form.resetFields();
      setSelectedUser(null);
      refresh();
    } catch {
      message.error("Failed to approve user.");
    } finally {
      modal.setLoading(false);
    }
  };

  const handleReject = async (user: PendingUser) => {
    try {
      await userService.rejectUser(user.id);
      message.success(`User ${user.username} has been rejected.`);
      refresh();
    } catch {
      message.error("Failed to reject user.");
    }
  };

  const columns: ColumnsType<PendingUser> = [
    { title: "Username", dataIndex: "username", key: "username" },
    {
      title: "Registration Date", dataIndex: "createdAt", key: "createdAt",
      render: (d: string) => formatDate(d, "DD MMM YYYY, HH:mm"),
    },
    {
      title: "Status", dataIndex: "status", key: "status",
      render: (s: string) => <Tag color="orange">{s.toUpperCase()}</Tag>,
    },
    ...(canManageApproval
      ? [
          {
            title: "Action" as const,
            key: "action",
            render: (_: unknown, record: PendingUser) => (
              <Space>
                <Button type="primary" size="small" onClick={() => {
                  setSelectedUser(record);
                  form.resetFields();
                  modal.open();
                }}>
                  Approve
                </Button>
                <Popconfirm title={`Reject ${record.username}?`} onConfirm={() => handleReject(record)} okText="Yes, Reject" cancelText="No">
                  <Button danger size="small">Reject</Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ];

  if (!canAccessApproval) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen flex items-center justify-center">
        <Typography.Text type="secondary">You don&apos;t have permission to access this page.</Typography.Text>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <DataTable
        title="Pending User Registrations"
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
      />

      <GlobalFormModal
        title={`Approve and Assign Roles for ${selectedUser?.username}`}
        open={modal.isOpen}
        onCancel={() => {
          modal.close();
          form.resetFields();
          setSelectedUser(null);
        }}
        form={form}
        confirmLoading={modal.loading}
        okText="Approve & Assign"
      >
        <DynamicForm form={form} fields={approvalFields} onFinish={handleApprove} />
      </GlobalFormModal>
    </div>
  );
}
