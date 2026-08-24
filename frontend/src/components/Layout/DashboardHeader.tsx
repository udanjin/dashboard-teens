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
import ThemeToggle from "@/components/Common/ThemeToggle";

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
          <p className="font-semibold text-gray-900 dark:text-[rgba(255,255,255,0.95)]">{user?.name}</p>
          <p className="text-gray-500 dark:text-[rgba(255,255,255,0.45)] text-sm">@{user?.username}</p>
        </div>
      ),
    },
    { type: "divider" },
    { key: "profile", label: "Profile", icon: <UserOutlined /> },
    { key: "logout", label: "Logout", icon: <LogoutOutlined />, onClick: onLogout, danger: true },
  ];

  const notificationDropdown = (
    <div className="bg-white dark:bg-[#0A0A0A] rounded-2xl border border-gray-100 dark:border-white/10 shadow-2xl w-80 overflow-hidden">
      <div className="p-4 border-b border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
        <h3 className="font-semibold text-gray-900 dark:text-[rgba(255,255,255,0.95)]">Deletion Requests</h3>
      </div>
      <List
        loading={loading}
        dataSource={requests}
        locale={{ emptyText: <Empty description="No new notifications" className="py-6" /> }}
        renderItem={(item) => (
          <List.Item
            className="hover:bg-gray-50 dark:hover:bg-white/5 cursor-pointer transition-colors px-4 py-3 border-b border-gray-100 dark:border-white/5 last:border-b-0"
            onClick={() => {
              setSelectedRequest(item);
              setIsConfirmModalOpen(true);
            }}
          >
            <div className="w-full">
              <p className="font-semibold text-gray-900 dark:text-[rgba(255,255,255,0.95)]">{item.name}</p>
              <p className="text-sm text-gray-500 dark:text-[rgba(255,255,255,0.45)] truncate">
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
      <header className="absolute top-0 right-0 left-0 h-20 bg-white/80 dark:bg-black/20 backdrop-blur-xl border-b border-gray-200 dark:border-white/10 shrink-0 flex items-center px-8 z-30 transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]">
        <div className="flex justify-between items-center w-full">
          <Button
            type="text"
            icon={<MenuOutlined className="text-gray-500 dark:text-[rgba(255,255,255,0.7)]" />}
            onClick={onMenuClick}
            className="lg:hidden hover:bg-gray-100 dark:hover:bg-white/5"
          />
          <div className="flex items-center gap-6 ml-auto">
            <ThemeToggle />
            
            {canManageDeletions && (
              <Dropdown
                dropdownRender={() => notificationDropdown}
                trigger={["click"]}
                placement="bottomRight"
              >
                <Badge count={requests.length} className="cursor-pointer">
                  <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center justify-center transition-colors">
                    <BellOutlined className="text-gray-600 dark:text-[rgba(255,255,255,0.7)] text-lg" />
                  </div>
                </Badge>
              </Dropdown>
            )}
            <Dropdown
              menu={{ items: userMenuItems }}
              trigger={["click"]}
              placement="bottomRight"
            >
              <div className="flex items-center gap-3 cursor-pointer group p-1.5 pr-4 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 border border-transparent hover:border-gray-200 dark:hover:border-white/10 transition-all">
                <Avatar className="bg-primary text-white dark:bg-white/10 dark:font-medium">{user?.name?.charAt(0)}</Avatar>
                <span className="hidden sm:inline-block text-gray-700 dark:text-[rgba(255,255,255,0.8)] font-medium group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
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
            className="rounded-full"
          >
            Reject
          </Button>,
          <Button
            key="approve"
            type="primary"
            icon={<CheckCircleOutlined />}
            loading={loading}
            onClick={() => handleApproval("approve")}
            className="rounded-full"
          >
            Approve & Delete
          </Button>,
        ]}
      >
        {selectedRequest && (
          <div>
            <p className="text-gray-900 dark:text-[rgba(255,255,255,0.95)]">
              Are you sure you want to approve the deletion of{" "}
              <strong className="text-black dark:text-white">{selectedRequest.name}</strong>?
            </p>
            <p className="mt-4 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-[rgba(255,255,255,0.7)]">
              Reason provided: &ldquo;{selectedRequest.deletionReason}&rdquo;
            </p>
          </div>
        )}
      </Modal>
    </>
  );
}
