"use client";

import { useState, useCallback, useEffect } from "react";
import { Button, Form, Tag, message, Space, Popconfirm, Typography, Tabs } from "antd";
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
import type { PendingUser, Role, ApprovedUser, UpdateUserPayload } from "@/types";

const APPROVAL_MODAL_KEY = "approval-form";
const EDIT_USER_MODAL_KEY = "edit-user-form";

const GRADE_OPTIONS = [7, 8, 9, 10, 11, 12].map((g) => ({ value: g, label: String(g) }));
const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
];

export default function UserManagementPage() {
  const { hasPermission } = useRoleAccess();
  const canAccessApproval = hasPermission(PERMISSIONS.APPROVAL_VIEW) || hasPermission(PERMISSIONS.APPROVAL_MANAGE);
  const canManageApproval = hasPermission(PERMISSIONS.APPROVAL_MANAGE);

  const [approvalForm] = Form.useForm<{ roleIds: number[] }>();
  const [editForm] = Form.useForm<UpdateUserPayload>();
  
  const approvalModal = useModal(APPROVAL_MODAL_KEY);
  const editModal = useModal(EDIT_USER_MODAL_KEY);
  
  const [selectedPendingUser, setSelectedPendingUser] = useState<PendingUser | null>(null);
  const [selectedApprovedUser, setSelectedApprovedUser] = useState<ApprovedUser | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);

  const fetchPendingUsers = useCallback(async () => {
    const res = await userService.getPendingUsers();
    return res.data;
  }, []);

  const fetchApprovedUsers = useCallback(async () => {
    const res = await userService.getApprovedUsers();
    return res.data;
  }, []);

  const { data: pendingData, loading: pendingLoading, refresh: refreshPending } = useTableData(fetchPendingUsers);
  const { data: approvedData, loading: approvedLoading, refresh: refreshApproved } = useTableData(fetchApprovedUsers);

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

  const editFields: FieldConfig[][] = [
    [
      {
        name: "roleIds",
        label: "Assigned Roles:",
        componentType: "select",
        options: roleOptions,
        placeholder: "Please select roles",
        props: { mode: "multiple" as const, allowClear: true },
      },
    ],
    [
      {
        name: "gender",
        label: "Gender",
        componentType: "select",
        options: GENDER_OPTIONS,
        placeholder: "Select gender (Optional)",
        props: { allowClear: true },
      },
      {
        name: "grade",
        label: "Grade",
        componentType: "select",
        options: GRADE_OPTIONS,
        placeholder: "Select grade (Optional)",
        props: { allowClear: true },
      },
    ]
  ];

  const handleApprove = async (values: { roleIds: number[] }) => {
    if (!selectedPendingUser) return;
    approvalModal.setLoading(true);
    try {
      await userService.approveUser(selectedPendingUser.id, { roleIds: values.roleIds });
      message.success(`User ${selectedPendingUser.username} has been approved.`);
      approvalModal.close();
      approvalForm.resetFields();
      setSelectedPendingUser(null);
      refreshPending();
      refreshApproved();
    } catch {
      message.error("Failed to approve user.");
    } finally {
      approvalModal.setLoading(false);
    }
  };

  const handleReject = async (user: PendingUser) => {
    try {
      await userService.rejectUser(user.id);
      message.success(`User ${user.username} has been rejected.`);
      refreshPending();
    } catch {
      message.error("Failed to reject user.");
    }
  };

  const handleEditUser = async (values: UpdateUserPayload) => {
    if (!selectedApprovedUser) return;
    editModal.setLoading(true);
    try {
      await userService.updateUser(selectedApprovedUser.id, values);
      message.success(`User ${selectedApprovedUser.username} updated successfully.`);
      editModal.close();
      editForm.resetFields();
      setSelectedApprovedUser(null);
      refreshApproved();
    } catch {
      message.error("Failed to update user.");
    } finally {
      editModal.setLoading(false);
    }
  };

  const handleDeleteApproved = async (user: ApprovedUser) => {
    try {
      await userService.deleteUser(user.id);
      message.success(`User ${user.username} deleted permanently.`);
      refreshApproved();
    } catch {
      message.error("Failed to delete user.");
    }
  };

  const pendingColumns: ColumnsType<PendingUser> = [
    { title: "Username", dataIndex: "username", key: "username" },
    {
      title: "Registration Date", dataIndex: "createdAt", key: "createdAt",
      render: (d: string) => formatDate(d, "DD MMM YYYY, HH:mm"),
    },
    {
      title: "Status", dataIndex: "status", key: "status",
      render: (s: string) => <Tag color="orange">{s.toUpperCase()}</Tag>,
    },
    {
      title: "Requested Roles", dataIndex: "requestedRoles", key: "requestedRoles",
      render: (_: unknown, record: PendingUser) => {
        return (
          <Space direction="vertical" size="small">
            {record.requestedRoles && record.requestedRoles.length > 0 ? (
              <Space wrap>
                {record.requestedRoles.map((role) => (
                  <Tag color="purple" key={role}>{role.toUpperCase()}</Tag>
                ))}
              </Space>
            ) : (
              <Typography.Text type="secondary">None</Typography.Text>
            )}
            {(record.grade || record.gender) && (
              <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
                Group: {record.grade ? `Grade ${record.grade}` : "Any"} {record.gender ? `(${record.gender})` : ""}
              </Typography.Text>
            )}
          </Space>
        );
      },
    },
    ...(canManageApproval
      ? [
          {
            title: "Action" as const,
            key: "action",
            fixed: "right" as const,
            width: 170,
            render: (_: unknown, record: PendingUser) => (
              <Space>
                <Button type="primary" size="small" onClick={() => {
                  setSelectedPendingUser(record);
                  approvalForm.resetFields();
                  approvalModal.open();
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

  const approvedColumns: ColumnsType<ApprovedUser> = [
    { title: "Username", dataIndex: "username", key: "username" },
    {
      title: "Assigned Roles", dataIndex: "roles", key: "roles",
      render: (roles: Role[]) => (
        <Space wrap>
          {roles?.map((r) => <Tag color="blue" key={r.id}>{r.name.toUpperCase()}</Tag>)}
        </Space>
      )
    },
    {
      title: "Details", key: "details",
      render: (_: unknown, record: ApprovedUser) => {
        if (!record.grade && !record.gender) return <Typography.Text type="secondary">-</Typography.Text>;
        return (
           <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
            {record.grade ? `Grade ${record.grade}` : "Any"} {record.gender ? `(${record.gender})` : ""}
          </Typography.Text>
        )
      }
    },
    {
      title: "Status", dataIndex: "status", key: "status",
      render: (s: string) => <Tag color="green">{s.toUpperCase()}</Tag>,
    },
    ...(canManageApproval
      ? [
          {
            title: "Action" as const,
            key: "action",
            fixed: "right" as const,
            width: 170,
            render: (_: unknown, record: ApprovedUser) => (
              <Space>
                <Button type="default" size="small" onClick={() => {
                  setSelectedApprovedUser(record);
                  editForm.setFieldsValue({
                    roleIds: record.roles?.map((r) => r.id) || [],
                    grade: record.grade,
                    gender: record.gender
                  });
                  editModal.open();
                }}>
                  Edit
                </Button>
                <Popconfirm title={`Delete ${record.username} permanently?`} onConfirm={() => handleDeleteApproved(record)} okText="Yes, Delete" cancelText="No">
                  <Button danger size="small">Delete</Button>
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

  const items = [
    {
      key: "pending",
      label: `Pending Approvals (${pendingData.length})`,
      children: (
        <DataTable
          title="Pending User Registrations"
          columns={pendingColumns}
          dataSource={pendingData}
          loading={pendingLoading}
          rowKey="id"
          scroll={{ x: 800 }}
        />
      ),
    },
    {
      key: "approved",
      label: "Approved Users",
      children: (
        <DataTable
          title="All Approved Users"
          columns={approvedColumns}
          dataSource={approvedData}
          loading={approvedLoading}
          rowKey="id"
          scroll={{ x: 800 }}
        />
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <Typography.Title level={3} className="mb-6">User Management</Typography.Title>
      
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <Tabs defaultActiveKey="pending" items={items} />
      </div>

      <GlobalFormModal
        title={`Approve and Assign Roles for ${selectedPendingUser?.username}`}
        open={approvalModal.isOpen}
        onCancel={() => {
          approvalModal.close();
          approvalForm.resetFields();
          setSelectedPendingUser(null);
        }}
        form={approvalForm}
        confirmLoading={approvalModal.loading}
        okText="Approve & Assign"
      >
        <DynamicForm form={approvalForm} fields={approvalFields} onFinish={handleApprove} />
      </GlobalFormModal>

      <GlobalFormModal
        title={`Edit details for ${selectedApprovedUser?.username}`}
        open={editModal.isOpen}
        onCancel={() => {
          editModal.close();
          editForm.resetFields();
          setSelectedApprovedUser(null);
        }}
        form={editForm}
        confirmLoading={editModal.loading}
        okText="Save Changes"
      >
        <DynamicForm form={editForm} fields={editFields} onFinish={handleEditUser} />
      </GlobalFormModal>
    </div>
  );
}
