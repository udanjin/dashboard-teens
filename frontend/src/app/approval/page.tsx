"use client";

import { useState, useCallback, useEffect } from "react";
import { Button, Form, Tag, message, Space, Popconfirm, Typography, Tabs, Modal, Select, Switch } from "antd";
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

  const [approvalForm] = Form.useForm<{ roleIds: number[]; createFc?: boolean; fcId?: number; fcGrade?: number }>();
  const [editForm] = Form.useForm<UpdateUserPayload>();
  
  const approvalModal = useModal(APPROVAL_MODAL_KEY);
  const editModal = useModal(EDIT_USER_MODAL_KEY);
  
  const [selectedPendingUser, setSelectedPendingUser] = useState<PendingUser | null>(null);
  const [selectedApprovedUser, setSelectedApprovedUser] = useState<ApprovedUser | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [familyCells, setFamilyCells] = useState<{ id: number; name: string; grade: number; gender: string | null }[]>([]);
  
  const editingGender = Form.useWatch("gender", editForm);

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
    userService.getFamilyCells().then((res) => setFamilyCells(res.data)).catch(() => {});
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
    ],
    [
      {
        name: "fcId",
        label: "Family Cell",
        componentType: "select",
        options: familyCells
          .filter((fc) => {
            const targetGender = editingGender || selectedApprovedUser?.gender;
            return !fc.gender || !targetGender || fc.gender === targetGender;
          })
          .map((fc) => ({ value: fc.id, label: `${fc.name} (Grade ${fc.grade}) ${fc.gender ? `(${fc.gender})` : ""}` })),
        placeholder: "Assign to Family Cell (Optional)",
        props: { allowClear: true, showSearch: true, optionFilterProp: "label" },
      },
    ]
  ];

  const handleApprove = async () => {
    if (!selectedPendingUser) return;
    approvalModal.setLoading(true);
    try {
      const values = await approvalForm.validateFields();
      await userService.approveUser(selectedPendingUser.id, {
        roleIds: values.roleIds,
        fcId: values.createFc ? undefined : values.fcId,
        createFc: values.createFc,
        fcGrade: values.createFc ? values.fcGrade : undefined,
      });
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
        const rolesArray = record.requestedRoles?.roles || [];
        const reqGrade = record.requestedRoles?.requestedGrade || null;
        return (
          <Space direction="vertical" size="small">
            {rolesArray.length > 0 ? (
              <Space wrap>
                {rolesArray.map((role) => (
                  <Tag color="purple" key={role}>{role.toUpperCase()}</Tag>
                ))}
              </Space>
            ) : (
              <Typography.Text type="secondary">None</Typography.Text>
            )}
            {(reqGrade || record.gender) && (
              <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
                Group: {reqGrade ? `Grade ${reqGrade}` : "Any"} {record.gender ? `(${record.gender})` : ""}
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
                  // Pre-fill the grade if they requested one
                  const reqGrade = record.requestedRoles?.requestedGrade;
                  approvalForm.setFieldsValue({
                    createFc: true,
                    fcGrade: reqGrade,
                    roleIds: [], // User still needs to select roles
                  });
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
        if (!record.familyCell && !record.gender) return <Typography.Text type="secondary">-</Typography.Text>;
        return (
           <Typography.Text type="secondary" style={{ fontSize: "12px" }}>
            {record.familyCell ? `${record.familyCell.name}` : "No FC"} {record.gender ? `(${record.gender})` : ""}
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
                    fcId: record.fcId,
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

      <Modal
        title={`Approve ${selectedPendingUser?.username}`}
        open={approvalModal.isOpen}
        onCancel={() => {
          approvalModal.close();
          approvalForm.resetFields();
          setSelectedPendingUser(null);
        }}
        onOk={handleApprove}
        confirmLoading={approvalModal.loading}
        okText="Approve & Assign"
        destroyOnClose
      >
        <div className="mb-4">
          <Typography.Text type="secondary">
            Assign the required roles and organize the user into a Family Cell.
          </Typography.Text>
        </div>
        <Form form={approvalForm} layout="vertical" preserve={false}>
          <Form.Item
            name="roleIds"
            label="Roles to Assign"
            rules={[{ required: true, message: "Please select at least one role" }]}
          >
            <Select
              mode="multiple"
              options={roleOptions}
              placeholder="Select roles"
              allowClear
            />
          </Form.Item>

          <Form.Item name="createFc" valuePropName="checked">
            <Switch checkedChildren="Create New Family Cell" unCheckedChildren="Assign to Existing Family Cell" />
          </Form.Item>

          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) => prevValues.createFc !== currentValues.createFc}
          >
            {({ getFieldValue }) => {
              const isCreateNew = getFieldValue("createFc");
              return isCreateNew ? (
                <Form.Item
                  name="fcGrade"
                  label="Grade for New Family Cell"
                  rules={[{ required: true, message: "Please select a grade for the new FC" }]}
                >
                  <Select options={GRADE_OPTIONS} placeholder="Select grade" />
                </Form.Item>
              ) : (
                <Form.Item
                  name="fcId"
                  label="Select Existing Family Cell"
                  rules={[{ required: true, message: "Please select an existing FC" }]}
                >
                  <Select
                    options={familyCells
                      .filter((fc) => !fc.gender || !selectedPendingUser?.gender || fc.gender === selectedPendingUser?.gender)
                      .map((fc) => ({
                        value: fc.id,
                        label: `${fc.name} (Grade ${fc.grade}) ${fc.gender ? `(${fc.gender})` : ""}`,
                      }))}
                    placeholder="Select Family Cell"
                    showSearch
                    optionFilterProp="label"
                  />
                </Form.Item>
              );
            }}
          </Form.Item>
        </Form>
      </Modal>

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
