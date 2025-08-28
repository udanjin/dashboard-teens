"use client";

import { useState, useEffect } from "react";
import { Table, Tag, Button, Modal, Select, message, Space } from "antd";
import type { ColumnsType } from "antd/es/table";
import axiosInstance from "@/lib/axiosInstance";
import dayjs from "dayjs";

interface User {
  id: string;
  username: string;
  status: "pending" | "approved" | "rejected";
  role: string | null;
  createdAt: string;
}

// Predefined roles that admin can choose from
const AVAILABLE_ROLES = [
  { value: "admin", label: "Admin" },
  { value: "fcl", label: "FCL" },
  { value: "sports", label: "Sports" },
  { value: "leader", label: "Leader" },
];

export default function AdminApprovalPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("");

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/users/pending");
      setUsers(response.data);
    } catch (error) {
      message.error("Failed to fetch pending users.");
      console.error("Fetch users error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApproveClick = (user: User) => {
    setSelectedUser(user);
    // Set default role to 'user'
    setSelectedRole("");
    setIsModalOpen(true);
  };

  const handleApprovalSubmit = async () => {
    if (!selectedUser || !selectedRole) {
      message.warning("Please select a role for the user.");
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.put(`/users/approve/${selectedUser.id}`, {
        role: selectedRole,
      });
      
      message.success(
        `User ${selectedUser.username} has been approved as ${selectedRole}.`
      );
      setIsModalOpen(false);
      setSelectedUser(null);
      setSelectedRole("");
      fetchUsers(); // Reload users data
    } catch (error) {
      message.error("Failed to approve user.");
      console.log(selectedRole);
      console.error("Approve user error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectUser = async (user: User) => {
    setLoading(true);
    try {
      await axiosInstance.put(`/users/reject/${user.id}`);
      message.success(`User ${user.username} has been rejected.`);
      fetchUsers(); // Reload users data
    } catch (error) {
      message.error("Failed to reject user.");
      console.error("Reject user error:", error);
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnsType<User> = [
    {
      title: "Username",
      dataIndex: "username",
      key: "username",
      sorter: (a, b) => a.username.localeCompare(b.username),
    },
    {
      title: "Registration Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date) => dayjs(date).format("DD MMM YYYY, HH:mm"),
      sorter: (a, b) => dayjs(a.createdAt).unix() - dayjs(b.createdAt).unix(),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag
          color={
            status === "pending"
              ? "orange"
              : status === "approved"
              ? "green"
              : "red"
          }
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            onClick={() => handleApproveClick(record)}
            size="small"
          >
            Approve
          </Button>
          <Button danger onClick={() => handleRejectUser(record)} size="small">
            Reject
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Pending User Registrations
        </h1>

        <div className="bg-white rounded-lg shadow-sm w-full">
          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            loading={loading}
            bordered
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} users`,
            }}
            locale={{
              emptyText: "No pending registrations",
            }}
          />
        </div>

        <Modal
          title={
            <div className="text-lg font-semibold text-gray-800">
              Approve User:{" "}
              <span className="text-indigo-600">{selectedUser?.username}</span>
            </div>
          }
          open={isModalOpen}
          onOk={handleApprovalSubmit}
          onCancel={() => {
            setIsModalOpen(false);
            setSelectedUser(null);
            setSelectedRole("");
          }}
          confirmLoading={loading}
          okText="Approve User"
          cancelText="Cancel"
          okButtonProps={{
            className: "bg-indigo-600 hover:bg-indigo-700",
          }}
        >
          <div className="py-4">
            <p className="mb-4 text-gray-600">
              Select a role to assign to this user:
            </p>
            <Select
              value={selectedRole}
              style={{ width: "100%" }}
              size="large"
              onChange={(value) => setSelectedRole(value)}
              options={AVAILABLE_ROLES}
              placeholder="Choose a role for the user"
              className="mb-4"
            />
            {selectedRole && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>{selectedUser?.username}</strong> will be approved
                  with the role:{" "}
                  <span className="font-semibold text-indigo-600">
                    {
                      AVAILABLE_ROLES.find(
                        (role) => role.value === selectedRole
                      )?.label
                    }
                  </span>
                </p>
              </div>
            )}
          </div>
        </Modal>
      </div>
    </div>
  );
}
