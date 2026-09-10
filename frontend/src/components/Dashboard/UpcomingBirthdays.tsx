"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  List,
  Avatar,
  Tag,
  Button,
  Modal,
  Calendar,
  Badge,
  Tooltip,
  Skeleton,
  Empty,
} from "antd";
import {
  GiftOutlined,
  CalendarOutlined,
  UserOutlined,
} from "@ant-design/icons";
import dayjs, { type Dayjs } from "dayjs";
import { fclService } from "@/services";
import type { Birthday } from "@/types";

interface UpcomingBirthdayItem extends Birthday {
  daysRemaining: number;
  nextDate: Dayjs;
}

export default function UpcomingBirthdays() {
  const [birthdays, setBirthdays] = useState<Birthday[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  useEffect(() => {
    const fetchBirthdays = async () => {
      setLoading(true);
      try {
        const res = await fclService.getBirthdays();
        setBirthdays(res.data || []);
      } catch (err) {
        console.error("Failed to fetch birthdays", err);
      } finally {
        setLoading(false);
      }
    };
    fetchBirthdays();
  }, []);

  // Compute upcoming birthdays in the next 30 days
  const upcomingList: UpcomingBirthdayItem[] = useMemo(() => {
    const today = dayjs().startOf("day");

    return birthdays
      .map((item) => {
        const parsed = dayjs(item.date);
        let nextDate = dayjs()
          .month(parsed.month())
          .date(parsed.date())
          .startOf("day");

        if (nextDate.isBefore(today, "day")) {
          nextDate = nextDate.add(1, "year");
        }

        const daysRemaining = nextDate.diff(today, "day");
        return {
          ...item,
          daysRemaining,
          nextDate,
        };
      })
      .filter((item) => item.daysRemaining >= 0 && item.daysRemaining <= 30)
      .sort((a, b) => a.daysRemaining - b.daysRemaining)
      .slice(0, 6); // Top 6 upcoming
  }, [birthdays]);

  // Full calendar date cell renderer for modal
  const getListData = (value: Dayjs): Birthday[] =>
    birthdays.filter((item) => {
      const d = dayjs(item.date);
      return d.month() === value.month() && d.date() === value.date();
    });

  const dateCellRender = (value: Dayjs) => {
    const list = getListData(value);
    if (!list.length) return null;
    return (
      <ul className="m-0 p-0 list-none">
        {list.map((item, i) => (
          <li key={i} className="truncate">
            <Tooltip title={`${item.name} (${item.type})`}>
              <Badge status="success" text={item.name} className="text-xs" />
            </Tooltip>
          </li>
        ))}
      </ul>
    );
  };

  const getRemainingTag = (days: number) => {
    if (days === 0) {
      return (
        <Tag color="magenta" className="font-semibold rounded-full px-2">
          Today! 🎉
        </Tag>
      );
    }
    if (days === 1) {
      return (
        <Tag color="volcano" className="font-medium rounded-full px-2">
          Tomorrow
        </Tag>
      );
    }
    if (days <= 7) {
      return (
        <Tag color="orange" className="font-medium rounded-full px-2">
          In {days} days
        </Tag>
      );
    }
    return (
      <Tag color="blue" className="rounded-full px-2">
        In {days} days
      </Tag>
    );
  };

  return (
    <>
      <Card
        bordered={false}
        className="shadow-sm hover:shadow-md transition-shadow rounded-xl border border-gray-100"
        title={
          <div className="flex items-center gap-2">
            <div className="p-2 bg-pink-50 text-pink-600 rounded-lg text-base">
              <GiftOutlined />
            </div>
            <div>
              <span className="font-semibold text-gray-800 text-base">Upcoming Birthdays</span>
              <p className="text-xs font-normal text-gray-400">Next 30 days</p>
            </div>
          </div>
        }
        extra={
          <Button
            type="link"
            icon={<CalendarOutlined />}
            onClick={() => setIsCalendarModalOpen(true)}
            className="text-xs text-blue-600 font-medium hover:text-blue-700 p-0 flex items-center"
          >
            Full Calendar
          </Button>
        }
      >
        {loading ? (
          <Skeleton active paragraph={{ rows: 4 }} />
        ) : upcomingList.length === 0 ? (
          <div className="py-6">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <span className="text-gray-400 text-xs">
                  No birthdays in the next 30 days.
                </span>
              }
            />
          </div>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={upcomingList}
            renderItem={(item) => (
              <List.Item className="!py-2.5 !border-b !border-gray-50 hover:bg-gray-50/70 transition-colors rounded-lg px-2">
                <List.Item.Meta
                  avatar={
                    <Avatar
                      className={
                        item.daysRemaining === 0
                          ? "bg-gradient-to-tr from-pink-500 to-rose-400 text-white font-bold"
                          : "bg-purple-100 text-purple-600 font-semibold"
                      }
                      size="default"
                    >
                      {item.name ? item.name.charAt(0).toUpperCase() : <UserOutlined />}
                    </Avatar>
                  }
                  title={
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm text-gray-800 truncate max-w-[140px]">
                        {item.name}
                      </span>
                      <Tag
                        color={item.type === "User" ? "purple" : "cyan"}
                        className="text-[10px] px-1.5 py-0 border-0 rounded"
                      >
                        {item.type === "User" ? "Leader" : "Member"}
                      </Tag>
                    </div>
                  }
                  description={
                    <span className="text-xs text-gray-400">
                      📅 {item.nextDate.format("MMMM D")}
                    </span>
                  }
                />
                <div>{getRemainingTag(item.daysRemaining)}</div>
              </List.Item>
            )}
          />
        )}
      </Card>

      {/* Full Month Calendar Modal */}
      <Modal
        title={
          <div className="flex items-center gap-2 text-base font-semibold text-gray-800">
            <CalendarOutlined className="text-blue-600" />
            <span>Full Birthday Calendar</span>
          </div>
        }
        open={isCalendarModalOpen}
        onCancel={() => setIsCalendarModalOpen(false)}
        footer={null}
        width={900}
        centered
        className="top-6"
      >
        <div className="mt-4">
          <Calendar dateCellRender={dateCellRender} />
        </div>
      </Modal>
    </>
  );
}
