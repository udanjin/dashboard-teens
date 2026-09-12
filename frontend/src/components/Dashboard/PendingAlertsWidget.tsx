"use client";

import React, { useEffect, useState } from "react";
import { Card, Tag, Button, Skeleton } from "antd";
import {
  BellOutlined,
  CheckCircleOutlined,
  UserAddOutlined,
  UserDeleteOutlined,
  RightOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import { userService, fclService } from "@/services";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { PERMISSIONS } from "@/types";

export default function PendingAlertsWidget() {
  const { hasPermission } = useRoleAccess();
  const canViewApproval = hasPermission(PERMISSIONS.APPROVAL_VIEW);
  const canManageDeletions = hasPermission(PERMISSIONS.FCL_MANAGE_DELETIONS);
  const canViewFclSummary = hasPermission(PERMISSIONS.FCL_VIEW_SUMMARY);

  const [pendingUsersCount, setPendingUsersCount] = useState<number>(0);
  const [deletionRequestsCount, setDeletionRequestsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchAlerts = async () => {
      setLoading(true);
      try {
        const promises: Promise<any>[] = [];

        if (canViewApproval) {
          promises.push(userService.getPendingUsers());
        } else {
          promises.push(Promise.resolve({ data: [] }));
        }

        if (canManageDeletions) {
          promises.push(fclService.getDeletionRequests());
        } else {
          promises.push(Promise.resolve({ data: [] }));
        }

        const results = await Promise.allSettled(promises);

        if (isMounted) {
          if (results[0].status === "fulfilled" && results[0].value) {
            setPendingUsersCount(results[0].value.data?.length || 0);
          }
          if (results[1].status === "fulfilled" && results[1].value) {
            setDeletionRequestsCount(results[1].value.data?.length || 0);
          }
        }
      } catch (err) {
        console.error("Failed to load alerts", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAlerts();

    return () => {
      isMounted = false;
    };
  }, [canViewApproval, canManageDeletions]);

  const totalAlerts = pendingUsersCount + deletionRequestsCount;

  return (
    <Card
      bordered={false}
      className="shadow-sm hover:shadow-md transition-shadow rounded-xl border border-gray-100 mb-6"
      title={
        <div className="flex items-center gap-2">
          <div className="p-2 bg-purple-50 text-purple-600 rounded-lg text-base">
            <BellOutlined />
          </div>
          <div>
            <span className="font-semibold text-gray-800 text-base">Action Center & Alerts</span>
            <p className="text-xs font-normal text-gray-400">Verifications & pending items</p>
          </div>
        </div>
      }
      extra={
        totalAlerts > 0 ? (
          <Tag color="error" className="rounded-full px-2 font-semibold">
            {totalAlerts} Action Required
          </Tag>
        ) : (
          <Tag color="success" className="rounded-full px-2">
            All Caught Up
          </Tag>
        )
      }
    >
      {loading ? (
        <Skeleton active paragraph={{ rows: 2 }} />
      ) : (
        <div className="space-y-3">
          {canViewApproval && pendingUsersCount > 0 && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-lg text-sm">
                  <UserAddOutlined />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-900 m-0">
                    {pendingUsersCount} New User Applications
                  </p>
                  <span className="text-xs text-amber-700">Awaiting account verification</span>
                </div>
              </div>
              <Link href="/approval">
                <Button
                  size="small"
                  type="primary"
                  className="bg-amber-600 hover:!bg-amber-700 text-xs font-medium rounded-lg"
                >
                  Review
                </Button>
              </Link>
            </div>
          )}

          {canManageDeletions && deletionRequestsCount > 0 && (
            <div className="p-3 bg-rose-50/70 border border-rose-200/60 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-100 text-rose-700 rounded-lg text-sm">
                  <UserDeleteOutlined />
                </div>
                <div>
                  <p className="text-sm font-semibold text-rose-900 m-0">
                    {deletionRequestsCount} Deletion Requests
                  </p>
                  <span className="text-xs text-rose-700">Members requested for deletion</span>
                </div>
              </div>
              <Link href="/approval">
                <Button
                  size="small"
                  danger
                  type="primary"
                  className="text-xs font-medium rounded-lg"
                >
                  Review
                </Button>
              </Link>
            </div>
          )}

          {totalAlerts === 0 && (
            <div className="py-4 text-center bg-gray-50/70 rounded-xl border border-dashed border-gray-200">
              <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 mb-1">
                <CheckCircleOutlined />
              </div>
              <p className="text-sm font-medium text-gray-700 m-0">All Caught Up! ✨</p>
              <span className="text-xs text-gray-400">No pending approvals or requests at this time.</span>
            </div>
          )}

          {/* Quick Nav Shortcuts */}
          {/* <div className="pt-3 border-t border-gray-100">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2">
              Quick Navigation
            </span>
            <div className="grid grid-cols-2 gap-2">
              {canViewFclSummary ? (
                <Link href="/fcl/leaders" className="block">
                  <div className="p-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-700 text-xs font-medium transition-colors flex items-center justify-between">
                    <span>👥 Leaders Summary</span>
                    <RightOutlined className="text-[10px] text-gray-400" />
                  </div>
                </Link>
              ) : (
                <Link href="/fcl" className="block">
                  <div className="p-2 rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-blue-600 text-gray-700 text-xs font-medium transition-colors flex items-center justify-between">
                    <span>📋 My FC Group</span>
                    <RightOutlined className="text-[10px] text-gray-400" />
                  </div>
                </Link>
              )}
              <Link href="/sports" className="block">
                <div className="p-2 rounded-lg bg-gray-50 hover:bg-emerald-50 hover:text-emerald-600 text-gray-700 text-xs font-medium transition-colors flex items-center justify-between">
                  <span>⚽ Sports & Funds</span>
                  <RightOutlined className="text-[10px] text-gray-400" />
                </div>
              </Link>
            </div>
          </div> */}
        </div>
      )}
    </Card>
  );
}
