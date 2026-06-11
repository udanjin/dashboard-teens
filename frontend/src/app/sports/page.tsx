"use client";

import { useState, useCallback } from "react";
import { Button, Form, Tag, message, Popconfirm, Typography } from "antd";
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useModal } from "@/stores/modalStore";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { sportsService } from "@/services";
import { useTableData } from "@/components/Common/DataTable";
import DataTable from "@/components/Common/DataTable";
import GlobalFormModal from "@/components/Common/GlobalFormModal";
import SportsEventForm from "@/components/Sports/SportsEventForm";
import EventDetailsModal from "@/components/Sports/EventDetailsModal";
import { formatDate, formatCurrency, sumCosts } from "@/lib/formatters";
import type { SportEvent, FinancialDetail } from "@/types";
import { CATEGORY_OPTIONS, PERMISSIONS } from "@/types";

const MODAL_KEY = "sports-form";
const DETAILS_KEY = "sports-details";

export default function SportsPage() {
  const [form] = Form.useForm();
  const formModal = useModal(MODAL_KEY);
  const detailsModal = useModal(DETAILS_KEY);
  const { hasPermission } = useRoleAccess();
  const canViewSports = hasPermission(PERMISSIONS.SPORTS_VIEW);
  const canManage = hasPermission(PERMISSIONS.SPORTS_MANAGE);
  const [selectedEvent, setSelectedEvent] = useState<SportEvent | null>(null);

  const fetchFn = useCallback(() => sportsService.getAll(), []);
  const { data, loading, refresh } = useTableData(fetchFn);

  const openCreate = () => {
    form.resetFields();
    formModal.open();
  };

  const openEdit = (record: SportEvent) => {
    form.setFieldsValue({ ...record, date: dayjs(record.date) });
    formModal.open();
  };

  const handleFinish = async (values: Record<string, unknown>) => {
    formModal.setLoading(true);
    const expenses = (values.expenseDetails as FinancialDetail[]) || [];
    const income = (values.pemasukanDetails as FinancialDetail[]) || [];
    try {
      const payload = {
        code: values.code as SportEvent["code"],
        date: dayjs(values.date as string).toISOString(),
        sportsCategory: values.category as SportEvent["category"],
        venue: values.venue as string,
        participant: values.participant as number,
        detailPengeluaran: expenses,
        detailPemasukan: income,
        totalPemasukan: sumCosts(income),
        totalPengeluaran: sumCosts(expenses),
      };
      const id = values.id as string | undefined;
      if (id) {
        await sportsService.update(id, payload);
        message.success("Event updated successfully!");
      } else {
        await sportsService.create(payload);
        message.success("Event added successfully!");
      }
      formModal.close();
      refresh();
    } catch {
      message.error("Failed to save event.");
    } finally {
      formModal.setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await sportsService.delete(id);
      message.success("Report deleted.");
      refresh();
    } catch {
      message.error("Failed to delete report.");
    }
  };

  const columns: ColumnsType<SportEvent> = [
    {
      title: "Date", dataIndex: "date", key: "date", width: 120,
      render: (d: string) => <span className="text-xs sm:text-sm whitespace-nowrap">{formatDate(d)}</span>,
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      responsive: ["sm"],
    },
    {
      title: "Code", dataIndex: "code", key: "code", width: 70,
      render: (c: string) => <Tag color={c === "C" ? "blue" : "green"} className="text-xs">{c}</Tag>,
      responsive: ["md"],
    },
    {
      title: "Category", dataIndex: "category", key: "category", width: 100,
      filters: CATEGORY_OPTIONS.map((o) => ({ text: o.label, value: o.value })),
      onFilter: (v, r) => r.category === v,
    },
    { title: "Participant", dataIndex: "participant", key: "participant", width: 90, responsive: ["lg"] },
    { title: "Venue", dataIndex: "venue", key: "venue", width: 150, responsive: ["md"], ellipsis: true },
    {
      title: "Pengeluaran", dataIndex: "totalpengeluaran", key: "totalpengeluaran", width: 120,
      render: (a: number) => <span className="text-red-500 font-medium text-xs sm:text-sm whitespace-nowrap">{formatCurrency(a ?? 0)}</span>,
      sorter: (a, b) => a.totalpengeluaran - b.totalpengeluaran,
      responsive: ["sm"],
    },
    {
      title: "Pemasukan", dataIndex: "totalpemasukan", key: "totalpemasukan", width: 120,
      render: (a: number) => <span className="text-green-500 font-medium text-xs sm:text-sm whitespace-nowrap">{formatCurrency(a ?? 0)}</span>,
      sorter: (a, b) => a.totalpemasukan - b.totalpemasukan,
      responsive: ["sm"],
    },
    {
      title: "Action", key: "action", fixed: "right", width: canManage ? 120 : 50,
      render: (_, record) => (
        <div className="flex gap-1">
          <Button size="small" type="text" icon={<EyeOutlined />} className="text-blue-500 p-1"
            onClick={() => { setSelectedEvent(record); detailsModal.open(); }} />
          {canManage && (
            <>
              <Button size="small" icon={<EditOutlined />} className="p-1" onClick={() => openEdit(record)} />
              <Popconfirm title="Delete event?" onConfirm={() => handleDelete(record.id)} okText="Yes" cancelText="No">
                <Button size="small" danger icon={<DeleteOutlined />} className="p-1" />
              </Popconfirm>
            </>
          )}
        </div>
      ),
    },
  ];

  if (!canViewSports) {
    return (
      <div className="w-full p-6 flex items-center justify-center min-h-[50vh]">
        <Typography.Text type="secondary">You don&apos;t have permission to access this page.</Typography.Text>
      </div>
    );
  }

  return (
    <div className="w-full">
      <DataTable
        title="Sports Events"
        toolbar={
          canManage ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate} className="w-full sm:w-auto">
              Add Event
            </Button>
          ) : undefined
        }
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="key"
        scroll={{ x: 800 }}
        size="small"
        pagination={{ pageSize: 20, showSizeChanger: false, responsive: true }}
      />

      <GlobalFormModal
        title={form.getFieldValue("id") ? "Edit Event" : "Add New Event"}
        open={formModal.isOpen}
        onCancel={formModal.close}
        form={form}
        confirmLoading={formModal.loading}
        width="min(95vw, 800px)"
      >
        <SportsEventForm form={form} onFinish={handleFinish} loading={formModal.loading} />
      </GlobalFormModal>

      <EventDetailsModal
        event={selectedEvent}
        open={detailsModal.isOpen}
        onClose={detailsModal.close}
      />
    </div>
  );
}
