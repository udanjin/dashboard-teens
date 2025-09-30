"use client";

import { useState, useEffect } from "react";
import { Table, Tag, Button, message, Space, Popconfirm, Modal, Select, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import axiosInstance from "@/lib/axiosInstance";
import dayjs from "dayjs";

// Tipe data untuk User dan Role
interface User {
  id: string;
  username: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

interface Role {
  id: number;
  name: string;
}

export default function AdminApprovalPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [availableRoles, setAvailableRoles] = useState<Role[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);

  // --- Fetch data ---
  const fetchUsers = async () => {
    try {
      const response = await axiosInstance.get("/users/pending");
      setUsers(response.data);
    } catch (error) {
      message.error("Failed to fetch pending users.");
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await axiosInstance.get("/users/roles");
      setAvailableRoles(response.data);
      console.log(response);
    } catch (error) {
      message.error("Failed to fetch roles.");
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchUsers(), fetchRoles()]).finally(() => setLoading(false));
  }, []);

  // --- Handlers ---
  const handleApproveClick = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setSelectedRoleIds([]);
  };

  const handleApprovalSubmit = async () => {
    if (!selectedUser || selectedRoleIds.length === 0) {
      message.warning("Please assign at least one role.");
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.put(`/users/approve/${selectedUser.id}`, {
        roleIds: selectedRoleIds,
      });
      message.success(`User ${selectedUser.username} has been approved.`);
      handleModalCancel();
      fetchUsers(); // Refresh list
    } catch (error) {
      message.error("Failed to approve user.");
    } finally {
      setLoading(false);
      setAvailableRoles
    }
  };
  
  const handleRejectUser = async (user: User) => {
    setLoading(true);
    try {
      await axiosInstance.delete(`/users/reject/${user.id}`);
      message.success(`User ${user.username} has been rejected.`);
      fetchUsers();
    } catch (error) {
      message.error("Failed to reject user.");
    } finally {
      setLoading(false);
    }
  };

  // --- Table Columns ---
  const columns: ColumnsType<User> = [
    { title: "Username", dataIndex: "username", key: "username" },
    {
      title: "Registration Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => dayjs(date).format("DD MMM YYYY, HH:mm"),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => <Tag color="orange">{status.toUpperCase()}</Tag>,
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button type="primary" size="small" onClick={() => handleApproveClick(record)}>
            Approve
          </Button>
          <Popconfirm
            title={`Reject ${record.username}?`}
            onConfirm={() => handleRejectUser(record)}
            okText="Yes, Reject"
            cancelText="No"
          >
            <Button danger size="small">
              Reject
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const roleOptions = availableRoles.map(role => ({
    label: role.name.toUpperCase(), // Capitalize
    value: role.id,
  }));

  return (
    <>
      <div className="p-6 bg-gray-50 min-h-screen">
        <h1 className="text-2xl font-bold mb-6">Pending User Registrations</h1>
        <div className="bg-white rounded-lg shadow-md">
          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            loading={loading}
            bordered
          />
        </div>
      </div>

      <Modal
        title={`Approve and Assign Roles for ${selectedUser?.username}`}
        open={isModalOpen}
        onOk={handleApprovalSubmit}
        onCancel={handleModalCancel}
        confirmLoading={loading}
        okText="Approve & Assign"
      >
        <p className="my-4">Select one or more roles to assign to this user:</p>
        <Select
          mode="multiple"
          allowClear
          style={{ width: '100%' }}
          placeholder="Please select roles"
          onChange={(values) => setSelectedRoleIds(values)}
          options={roleOptions}
          loading={availableRoles.length === 0}
          value={selectedRoleIds}
        />
      </Modal>
    </>
  );
}