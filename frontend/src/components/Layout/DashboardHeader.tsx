"use client";

import React, { useEffect, useState, useCallback } from "react";
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
import { fclService } from "@/services";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { PERMISSIONS } from "@/types";
import type { UserInfo, DeletionRequest } from "@/types";

interface DashboardHeaderProps {
  user: UserInfo | null;
  onLogout: () => void;
  onMenuClick: () => void;
}

export default function DashboardHeader({
  user,
  onLogout,
  onMenuClick,
}: DashboardHeaderProps) {
  const [requests, setRequests] = useState<DeletionRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<DeletionRequest | null>(null);
  const { hasPermission } = useRoleAccess();
  const canManageDeletions = hasPermission(PERMISSIONS.FCL_MANAGE_DELETIONS);

  const fetchDeleteRequests = useCallback(async () => {
    if (!canManageDeletions) return;
    setLoading(true);
    try {
      const res = await fclService.getDeletionRequests();
      setRequests(res.data);
    } catch {
      // silently fail for notifications
    } finally {
      setLoading(false);
    }
  }, [canManageDeletions]);

  useEffect(() => {
    fetchDeleteRequests();
  }, [fetchDeleteRequests]);

  const handleApproval = async (action: "approve" | "reject") => {
    if (!selectedRequest) return;
    setLoading(true);
    try {
      if (action === "approve") {
        await fclService.approveDeletion(selectedRequest.id);
        message.success(`Deletion for ${selectedRequest.name} approved.`);
      } else {
        await fclService.rejectDeletion(selectedRequest.id);
        message.info(`Deletion for ${selectedRequest.name} rejected.`);
      }
      setIsConfirmModalOpen(false);
      fetchDeleteRequests();
    } catch {
      message.error(`Failed to ${action} request`);
    } finally {
      setLoading(false);
    }
  };

  const userMenuItems: MenuProps["items"] = [
    {
      key: "user-info",
      label: (
        <div className="px-4 py-2">
          <p className="font-semibold">{user?.name}</p>
          <p className="text-gray-500 text-sm">@{user?.username}</p>
        </div>
      ),
    },
    { type: "divider" },
    { key: "profile", label: "Profile", icon: <UserOutlined /> },
    { key: "logout", label: "Logout", icon: <LogoutOutlined />, onClick: onLogout },
  ];

  const notificationDropdown = (
    <div className="bg-white rounded-md shadow-lg border w-80">
      <div className="p-4 border-b">
        <h3 className="font-semibold">Deletion Requests</h3>
      </div>
      <List
        loading={loading}
        dataSource={requests}
        locale={{ emptyText: <Empty description="No new notifications" /> }}
        renderItem={(item) => (
          <List.Item
            className="hover:bg-gray-50 cursor-pointer"
            onClick={() => {
              setSelectedRequest(item);
              setIsConfirmModalOpen(true);
            }}
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
      <header className="h-16 bg-white shadow-sm shrink-0 flex items-center px-6">
        <div className="flex justify-between items-center w-full">
          <Button
            type="text"
            icon={<MenuOutlined />}
            onClick={onMenuClick}
            className="lg:hidden"
          />
          <div className="flex items-center gap-6 ml-auto">
            {canManageDeletions && (
              <Dropdown
                dropdownRender={() => notificationDropdown}
                trigger={["click"]}
              >
                <Badge count={requests.length} className="cursor-pointer">
                  <BellOutlined className="text-gray-500 text-xl" />
                </Badge>
              </Dropdown>
            )}
            <Dropdown
              menu={{ items: userMenuItems }}
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
              Are you sure you want to approve the deletion of{" "}
              <strong>{selectedRequest.name}</strong>?
            </p>
            <p className="mt-2 text-gray-500">
              Reason provided: &ldquo;{selectedRequest.deletionReason}&rdquo;
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
