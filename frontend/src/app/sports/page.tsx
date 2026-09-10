"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Button,
  Form,
  Tag,
  message,
  Popconfirm,
  Typography,
  Tooltip,
  Card,
  Breadcrumb,
  Space,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DollarOutlined,
  ArrowLeftOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import type { ColumnsType } from "antd/es/table";
import dayjs, { type Dayjs } from "dayjs";
import { useModal } from "@/stores/modalStore";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useDebounce } from "@/hooks/useDebounce";
import { sportsService } from "@/services";
import DataTable from "@/components/Common/DataTable";
import GlobalFormModal from "@/components/Common/GlobalFormModal";
import SportsEventForm from "@/components/Sports/SportsEventForm";
import EventDetailsModal from "@/components/Sports/EventDetailsModal";
import SportsDashboardCards from "@/components/Sports/SportsDashboardCards";
import SportsDashboardCharts from "@/components/Sports/SportsDashboardCharts";
import SportsGlobalFilters from "@/components/Sports/SportsGlobalFilters";
import CashAdjustmentModal from "@/components/Sports/CashAdjustmentModal";
import { formatDate, formatCurrency, sumCosts } from "@/lib/formatters";
import type { SportEvent, FinancialDetail } from "@/types";
import { CATEGORY_OPTIONS, PERMISSIONS } from "@/types";
import type { SportReportKpis } from "@/types/sports.types";

const { Title, Text } = Typography;
const MODAL_KEY = "sports-form";
const DETAILS_KEY = "sports-details";

export default function SportsPage() {
  const [form] = Form.useForm();
  const formModal = useModal(MODAL_KEY);
  const detailsModal = useModal(DETAILS_KEY);
  const { hasPermission, isAdmin } = useRoleAccess();
  const canViewSports = hasPermission(PERMISSIONS.SPORTS_VIEW);
  const canManage = hasPermission(PERMISSIONS.SPORTS_MANAGE);

  const [selectedEvent, setSelectedEvent] = useState<SportEvent | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Filter states
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedCode, setSelectedCode] = useState<string>("All");
  const [searchText, setSearchText] = useState<string>("");
  const debouncedSearchText = useDebounce(searchText, 500);

  // Data states
  const [data, setData] = useState<SportEvent[]>([]);
  const [kpis, setKpis] = useState<SportReportKpis | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchFn = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedCategory !== "All") params.category = selectedCategory;
      if (selectedCode !== "All") params.code = selectedCode;
      if (debouncedSearchText) params.search = debouncedSearchText;
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.startDate = dateRange[0].format("YYYY-MM-DD");
        params.endDate = dateRange[1].format("YYYY-MM-DD");
      }

      const result = await sportsService.getAll(params);
      setData(result.data);
      setKpis(result.kpis);
    } catch {
      message.error("Failed to fetch sports data.");
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedCode, debouncedSearchText, dateRange]);

  useEffect(() => {
    if (canViewSports) {
      fetchFn();
    }
  }, [fetchFn, canViewSports]);

  const refresh = fetchFn;
  const filteredData = data;

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
      message.success("Report deleted successfully.");
      refresh();
    } catch {
      message.error("Failed to delete report.");
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case "futsal":
        return "green";
      case "badminton":
        return "blue";
      case "basket":
        return "orange";
      case "football":
        return "cyan";
      default:
        return "purple";
    }
  };

  const columns: ColumnsType<SportEvent> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 130,
      render: (d: string) => (
        <span className="text-xs sm:text-sm font-medium whitespace-nowrap text-gray-700">
          {formatDate(d)}
        </span>
      ),
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: "Group",
      dataIndex: "code",
      key: "code",
      width: 90,
      render: (c: string) => (
        <Tag
          color={c === "Pelayan" || c === "P" ? "purple" : "cyan"}
          className="text-xs font-semibold rounded-md border-0"
        >
          {c === "Pelayan" || c === "P" ? "Leaders" : "Teens"}
        </Tag>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (cat: string) => (
        <Tag color={getCategoryColor(cat)} className="font-semibold text-xs rounded-md border-0">
          {cat}
        </Tag>
      ),
      filters: CATEGORY_OPTIONS.map((o) => ({ text: o.label, value: o.value })),
      onFilter: (v, r) => r.category === v,
    },
    {
      title: "Participants",
      dataIndex: "participant",
      key: "participant",
      width: 110,
      align: "center",
      render: (p: number) => (
        <span className="font-semibold text-gray-700">{p} attendees</span>
      ),
    },
    {
      title: "Venue",
      dataIndex: "venue",
      key: "venue",
      width: 170,
      ellipsis: true,
      render: (v: string) => (
        <span className="text-gray-800 font-medium">{v || "—"}</span>
      ),
    },
    {
      title: "Income",
      dataIndex: "totalpemasukan",
      key: "totalpemasukan",
      width: 130,
      render: (a: number) => (
        <span className="text-emerald-600 font-semibold text-xs sm:text-sm whitespace-nowrap">
          {formatCurrency(a ?? 0)}
        </span>
      ),
      sorter: (a, b) => a.totalpemasukan - b.totalpemasukan,
    },
    {
      title: "Expenses",
      dataIndex: "totalpengeluaran",
      key: "totalpengeluaran",
      width: 130,
      render: (a: number) => (
        <span className="text-rose-500 font-semibold text-xs sm:text-sm whitespace-nowrap">
          {formatCurrency(a ?? 0)}
        </span>
      ),
      sorter: (a, b) => a.totalpengeluaran - b.totalpengeluaran,
    },
    {
      title: "Net Balance",
      key: "net",
      width: 130,
      render: (_, record) => {
        const net = (record.totalpemasukan || 0) - (record.totalpengeluaran || 0);
        return (
          <span
            className={`font-bold text-xs sm:text-sm whitespace-nowrap ${
              net >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {net >= 0 ? "+" : ""}
            {formatCurrency(net)}
          </span>
        );
      },
      sorter: (a, b) =>
        (a.totalpemasukan || 0) -
        (a.totalpengeluaran || 0) -
        ((b.totalpemasukan || 0) - (b.totalpengeluaran || 0)),
    },
    {
      title: "Action",
      key: "action",
      fixed: "right",
      width: 110,
      align: "center",
      render: (_, record) => (
        <div className="flex items-center justify-center gap-1">
          <Button
            size="small"
            type="text"
            icon={<EyeOutlined />}
            className="text-blue-500 hover:!text-blue-600"
            onClick={() => {
              setSelectedEvent(record);
              detailsModal.open();
            }}
            title="View details"
          />
          {canManage && (
            <>
              <Button
                size="small"
                type="text"
                icon={<EditOutlined />}
                className="text-gray-600 hover:!text-gray-900"
                onClick={() => openEdit(record)}
                title="Edit event"
              />
              <Popconfirm
                title="Delete this event record?"
                onConfirm={() => handleDelete(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  title="Delete event"
                />
              </Popconfirm>
            </>
          )}
        </div>
      ),
    },
  ];

  if (!canViewSports) {
    return (
      <div className="w-full p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Title level={4} className="text-gray-700">Access Restricted</Title>
        <Text type="secondary" className="max-w-md mb-4">
          You do not have permission to view sports activities and reports.
        </Text>
        <Link href="/dashboard">
          <Button type="primary" icon={<ArrowLeftOutlined />}>
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <Breadcrumb
          items={[
            { title: <Link href="/dashboard">Home</Link> },
            { title: "Sports" },
            { title: "Activities & Finance" },
          ]}
        />
        <Link href="/dashboard">
          <Button icon={<ArrowLeftOutlined />}>Back to Dashboard</Button>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <Title level={2} className="!mb-1 text-gray-800">
            Sports Activities & Finance
          </Title>
          <Text type="secondary" className="text-sm">
            Track youth sports activities, participant engagement, venue costs, and cash flow balance.
          </Text>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canManage && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreate}
              className="h-10 px-4 rounded-lg font-semibold flex items-center"
            >
              Add Event
            </Button>
          )}
          {isAdmin && (
            <Button
              icon={<DollarOutlined />}
              onClick={() => setAdjustmentModalOpen(true)}
              className="h-10 px-4 rounded-lg font-semibold flex items-center"
              style={{ borderColor: "#faad14", color: "#d48806" }}
            >
              Adjust Balance
            </Button>
          )}
        </div>
      </div>

      {/* KPI Cards & Charts */}
      <SportsDashboardCards kpis={kpis} />
      <SportsDashboardCharts data={filteredData} />

      {/* Global Filters */}
      <SportsGlobalFilters
        dateRange={dateRange}
        setDateRange={setDateRange}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedCode={selectedCode}
        setSelectedCode={setSelectedCode}
        searchText={searchText}
        setSearchText={setSearchText}
      />

      {/* Main Table Card */}
      <Card
        bordered={false}
        className="shadow-sm rounded-xl border border-gray-100"
        title={
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg text-base">
              <TrophyOutlined />
            </div>
            <div>
              <span className="font-semibold text-gray-800 text-base">Sports Events History</span>
              <p className="text-xs font-normal text-gray-400">
                {filteredData.length} recorded events
              </p>
            </div>
          </div>
        }
      >
        <DataTable
          columns={columns}
          dataSource={filteredData}
          loading={loading}
          rowKey="id"
          scroll={{ x: 950 }}
          size="middle"
          pagination={{ pageSize: 15, showSizeChanger: true, responsive: true }}
        />
      </Card>

      {/* Modals */}
      <GlobalFormModal
        title={form.getFieldValue("id") ? "Edit Sport Event" : "Add New Sport Event"}
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
        showCreator={canManage}
      />

      {isAdmin && (
        <CashAdjustmentModal
          open={adjustmentModalOpen}
          onClose={() => setAdjustmentModalOpen(false)}
          currentBalance={kpis?.netBalance ?? 0}
          onAdjustmentSaved={refresh}
        />
      )}
    </div>
  );
}
