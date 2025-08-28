"use client";

import {
  Dropdown,
  Avatar,
  Badge,
  Button,
  message,
  List,
  Empty,
  Modal,
} from "antd";
import type { MenuProps } from "antd";
import {
  BellOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import { act, useEffect, useState } from "react";
import axios from "axios";
import axiosInstance from "@/lib/axiosInstance";

interface UserInfo {
  name: string;
  username: string;
  role?: string;
}

interface DashboardHeaderProps {
  user: UserInfo | null;
  onLogout: () => void;
  onMenuClick: () => void;
  isCollapsed: boolean;
}
interface DeletionRequest {
  id: number;
  name: string;
  deletionReason: string;
}
export default function DashboardHeader({
  user,
  onLogout,
  onMenuClick,
  isCollapsed,
}: DashboardHeaderProps) {
  const [request, setRequest] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<DeletionRequest | null>(null);

  const fetchDeleteReq = async () => {
    if (user?.role !== "admin" && user!.role !== "fcl") return;
    setLoading(true);
    try {
      const res = await axiosInstance.get("/fcl/deletion-request");
      setRequest(res.data);
    } catch (err) {
      console.error("Failed to fetch", err);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchDeleteReq();
  }, [user]);
  const handleNotification = (request: DeletionRequest) => {
    setSelectedRequest(request);
    setIsConfirmModalOpen(true);
  };

  const handleApproval = async (action: "approve" | "reject") => {
    if (!selectedRequest) return;
    setLoading(true);
    try {
      if (action === "approve") {
        await axiosInstance.delete(
          `/fcl/approve-deletion/${selectedRequest.id}`
        );
        message.success(`Deletion for ${selectedRequest.name} approved.`);
      } else {
        await axiosInstance.put(`/fcl/reject-deletion/${selectedRequest.id}`);
        message.info(`Deletion for ${selectedRequest.name} rejected.`);
      }
      setIsConfirmModalOpen(false);
      fetchDeleteReq();
    } catch (err) {
      message.error(`Failed to ${action} request`);
    } finally {
      setLoading(false);
    }
  };
  const items: MenuProps["items"] = [
    {
      key: "1",
      label: (
        <div className="px-4 py-2">
          <p className="font-semibold">{user?.name}</p>
          <p className="text-gray-500 text-sm">@{user?.username}</p>
        </div>
      ),
    },
    {
      type: "divider",
    },
    {
      key: "2",
      label: "Profile",
      icon: <UserOutlined />,
    },
    {
      key: "3",
      label: "Logout",
      icon: <LogoutOutlined />,
      onClick: onLogout,
    },
  ];
  const notificationDropdown = (
    <div className="bg-white rounded-md shadow-lg border w-80">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Deletion Requests</h3>
      </div>
      <List
        loading={loading}
        dataSource={request}
        locale={{ emptyText: <Empty description="No new notifications" /> }}
        renderItem={(item) => (
          <List.Item
            className="hover:bg-gray-50 cursor-pointer"
            onClick={() => handleNotification(item)}
          >
            <div className="w-full px-4 py-2">
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-gray-500 truncate">
                Reason: {item.deletionReason}
              </p>
            </div>
          </List.Item>
        )}
      />
    </div>
  );
  return (
    <>
      <header
        className={`fixed top-0 h-16 bg-white shadow-sm z-30 flex items-center px-6 transition-all duration-300 ${
          "left-0 w-full " +
          (isCollapsed
            ? "lg:left-[80px] lg:w-[calc(100%-80px)]"
            : "lg:left-[250px] lg:w-[calc(100%-250px)]")
        }`}
      >
        <div className="flex justify-between items-center w-full">
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={onMenuClick}
            className="lg:hidden"
          />
          <div className="flex items-center gap-6 ml-auto">
            {(user?.role === "admin" || user?.role === "fcl") && (
              <Dropdown
                dropdownRender={() => notificationDropdown}
                trigger={["click"]}
              >
                <Badge count={request.length} className="cursor-pointer">
                  <BellOutlined className="text-gray-500 text-xl" />
                </Badge>
              </Dropdown>
            )}
            <Dropdown
              menu={{ items: items }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <div className="flex items-center gap-2 cursor-pointer">
                <Avatar>{user?.name?.charAt(0)}</Avatar>
                <span className="hidden sm:inline-block text-gray-700">
                  {user?.name}
                </span>
              </div>
            </Dropdown>
          </div>
        </div>
      </header>

      {/* Modal Konfirmasi Approval */}
      <Modal
        title="Confirm Deletion Request"
        open={isConfirmModalOpen}
        onCancel={() => setIsConfirmModalOpen(false)}
        footer={[
          <Button
            key="reject"
            danger
            icon={<CloseCircleOutlined />}
            onClick={() => handleApproval("reject")}
          >
            Reject
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={loading}
            onClick={() => handleApproval("approve")}
          >
            Approve & Delete
          </Button>,
        ]}
      >
        {selectedRequest && (
          <div>
            <p>
              Are you sure you want to approve the deletion of
              <strong>{selectedRequest.name}</strong>?
            </p>
            <p className="mt-2 text-gray-500">
              Reason provided: "{selectedRequest.deletionReason}"
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
