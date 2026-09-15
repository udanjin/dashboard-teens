"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Button,
  Form,
  Tag,
  message,
  Popconfirm,
  Typography,
  Card,
  Breadcrumb,
  Input,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  ArrowLeftOutlined,
  AppstoreOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import Link from "next/link";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useModal } from "@/stores/modalStore";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useDebounce } from "@/hooks/useDebounce";
import { sportsInventoryService } from "@/services";
import DataTable from "@/components/Common/DataTable";
import GlobalFormModal from "@/components/Common/GlobalFormModal";
import InventoryFormModal from "@/components/Sports/InventoryFormModal";
import { formatDate, formatCurrency } from "@/lib/formatters";
import type { SportInventory } from "@/types";
import { PERMISSIONS } from "@/types";

const { Title, Text } = Typography;
const MODAL_KEY = "sports-inventory-form";

export default function SportsInventoryPage() {
  const [form] = Form.useForm();
  const formModal = useModal(MODAL_KEY);
  const { hasPermission } = useRoleAccess();
  const canView = hasPermission(PERMISSIONS.SPORTS_VIEW);
  const canManage = hasPermission(PERMISSIONS.SPORTS_MANAGE);

  const [searchText, setSearchText] = useState<string>("");
  const debouncedSearchText = useDebounce(searchText, 500);

  const [data, setData] = useState<SportInventory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFn = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (debouncedSearchText) params.search = debouncedSearchText;

      const result = await sportsInventoryService.getAll(params);
      setData(result);
    } catch {
      message.error("Failed to fetch inventory data.");
    } finally {
      setLoading(false);
    }
  }, [debouncedSearchText]);

  useEffect(() => {
    if (canView) {
      fetchFn();
    }
  }, [fetchFn, canView]);

  const openCreate = () => {
    form.resetFields();
    form.setFieldsValue({ quantity: 1, pricePerItem: 0 });
    formModal.open();
  };

  const openEdit = (record: SportInventory) => {
    form.setFieldsValue({
      ...record,
      purchaseDate: dayjs(record.purchaseDate),
    });
    formModal.open();
  };

  const handleFinish = async (values: Record<string, unknown>) => {
    formModal.setLoading(true);
    try {
      const payload = {
        itemName: values.itemName as string,
        category: values.category as string,
        quantity: values.quantity as number,
        pricePerItem: values.pricePerItem as number,
        purchaseDate: dayjs(values.purchaseDate as string).toISOString(),
      };
      const id = values.id as string | undefined;
      
      if (id) {
        await sportsInventoryService.update(parseInt(id, 10), payload);
        message.success("Item updated successfully!");
      } else {
        await sportsInventoryService.create(payload);
        message.success("Item added successfully!");
      }
      formModal.close();
      fetchFn();
    } catch {
      message.error("Failed to save inventory item.");
    } finally {
      formModal.setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await sportsInventoryService.delete(id);
      message.success("Item deleted successfully.");
      fetchFn();
    } catch {
      message.error("Failed to delete item.");
    }
  };

  const columns: ColumnsType<SportInventory> = [
    {
      title: "Date",
      dataIndex: "purchaseDate",
      key: "purchaseDate",
      width: 130,
      render: (d: string) => (
        <span className="text-xs sm:text-sm font-medium whitespace-nowrap text-gray-700">
          {formatDate(d)}
        </span>
      ),
      sorter: (a, b) => new Date(a.purchaseDate).getTime() - new Date(b.purchaseDate).getTime(),
    },
    {
      title: "Item Name",
      dataIndex: "itemName",
      key: "itemName",
      render: (name: string) => (
        <span className="font-semibold text-gray-800">{name}</span>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 140,
      render: (cat: string) => (
        <Tag className="font-medium text-xs rounded-md border border-gray-200 bg-gray-50 text-gray-700">
          {cat}
        </Tag>
      ),
    },
    {
      title: "Qty",
      dataIndex: "quantity",
      key: "quantity",
      width: 80,
      align: "center",
      render: (q: number) => <span className="font-medium text-gray-700">{q}</span>,
    },
    {
      title: "Price/Item",
      dataIndex: "pricePerItem",
      key: "pricePerItem",
      width: 130,
      render: (p: number) => (
        <span className="text-gray-600 text-sm whitespace-nowrap">
          {formatCurrency(p)}
        </span>
      ),
    },
    {
      title: "Total Cost",
      dataIndex: "totalCost",
      key: "totalCost",
      width: 130,
      render: (t: number) => (
        <span className="text-rose-600 font-semibold text-sm whitespace-nowrap">
          {formatCurrency(t)}
        </span>
      ),
      sorter: (a, b) => a.totalCost - b.totalCost,
    },
    {
      title: "Action",
      key: "action",
      fixed: "right",
      width: 100,
      align: "center",
      render: (_, record) => (
        <div className="flex items-center justify-center gap-1">
          {canManage && (
            <>
              <Button
                size="small"
                type="text"
                icon={<EditOutlined />}
                className="text-gray-600 hover:!text-gray-900"
                onClick={() => openEdit(record)}
                title="Edit item"
              />
              <Popconfirm
                title="Delete this item?"
                onConfirm={() => handleDelete(record.id)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  title="Delete item"
                />
              </Popconfirm>
            </>
          )}
        </div>
      ),
    },
  ];

  if (!canView) {
    return (
      <div className="w-full p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Title level={4} className="text-gray-700">Access Restricted</Title>
        <Text type="secondary" className="max-w-md mb-4">
          You do not have permission to view inventory.
        </Text>
        <Link href="/sports">
          <Button type="primary" icon={<ArrowLeftOutlined />}>
            Back to Sports
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-64px)] p-4 sm:p-6 lg:p-8 max-w-[1600px] mx-auto bg-gray-50/30">
      {/* Breadcrumb & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <Breadcrumb
          items={[
            { title: <Link href="/dashboard">Home</Link> },
            { title: <Link href="/sports">Sports</Link> },
            { title: "Inventory" },
          ]}
        />
        <Link href="/sports">
          <Button icon={<ArrowLeftOutlined />} className="rounded-lg shadow-sm">Back to Sports</Button>
        </Link>
      </div>

      {/* Header Banner */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6 bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <Title level={2} className="!mb-2 text-gray-900 !text-2xl sm:!text-3xl">
            Sports Inventory
          </Title>
          <Text type="secondary" className="text-base text-gray-500 max-w-lg block">
            Track equipment purchases and asset costs. Inventory expenses are automatically deducted from the overall sports net balance.
          </Text>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Input
            placeholder="Search items..."
            prefix={<SearchOutlined className="text-gray-400" />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="w-full md:w-64 h-11 rounded-xl shadow-sm border-gray-200"
            allowClear
          />
          {canManage && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={openCreate}
              className="h-11 px-6 rounded-xl font-semibold shadow-sm"
            >
              Add Item
            </Button>
          )}
        </div>
      </div>

      {/* Main Table Card */}
      <Card
        bordered={false}
        className="shadow-sm rounded-2xl border border-gray-100 overflow-hidden"
        bodyStyle={{ padding: 0 }}
        title={
          <div className="flex items-center gap-3 py-2 px-2">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <AppstoreOutlined className="text-lg" />
            </div>
            <div>
              <span className="font-semibold text-gray-900 text-lg">Equipment Assets</span>
              <p className="text-sm font-normal text-gray-500 mt-0.5">
                {data.length} items currently logged
              </p>
            </div>
          </div>
        }
      >
        <div className="p-4 sm:p-6 bg-white">
          <DataTable
            columns={columns}
            dataSource={data}
            loading={loading}
            rowKey="id"
            scroll={{ x: 800 }}
            size="middle"
            pagination={{ pageSize: 15, showSizeChanger: true, responsive: true }}
          />
        </div>
      </Card>

      {/* Modals */}
      <GlobalFormModal
        title={form.getFieldValue("id") ? "Edit Inventory Item" : "Add New Inventory Item"}
        open={formModal.isOpen}
        onCancel={formModal.close}
        form={form}
        confirmLoading={formModal.loading}
        width="min(95vw, 600px)"
      >
        <InventoryFormModal form={form} onFinish={handleFinish} loading={formModal.loading} />
      </GlobalFormModal>
    </div>
  );
}
