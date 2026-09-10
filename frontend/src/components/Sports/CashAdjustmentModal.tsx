"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Input,
  DatePicker,
  Radio,
  Button,
  Table,
  Tag,
  Alert,
  Popconfirm,
  message,
  Typography,
  Divider,
  Empty,
} from "antd";
import {
  WarningOutlined,
  DeleteOutlined,
  PlusOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { sportsService } from "@/services";
import type { CashAdjustment } from "@/services/sports.service";
import { formatCurrency, formatDate, currencyFormatter, currencyParser } from "@/lib/formatters";

const { Text } = Typography;
const { TextArea } = Input;

interface CashAdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  currentBalance: number;
  onAdjustmentSaved: () => void;
}

export default function CashAdjustmentModal({
  open,
  onClose,
  currentBalance,
  onAdjustmentSaved,
}: CashAdjustmentModalProps) {
  const [form] = Form.useForm();
  const [adjustments, setAdjustments] = useState<CashAdjustment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const fetchAdjustments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await sportsService.getAdjustments();
      setAdjustments(data);
    } catch {
      message.error("Failed to load adjustments.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      fetchAdjustments();
      setShowForm(false);
    }
  }, [open, fetchAdjustments]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);
      await sportsService.createAdjustment({
        type: values.type,
        amount: values.amount,
        reason: values.reason,
        effectiveDate: values.effectiveDate.format("YYYY-MM-DD"),
      });
      message.success("Balance adjustment saved.");
      form.resetFields();
      setShowForm(false);
      fetchAdjustments();
      onAdjustmentSaved();
    } catch (err: any) {
      if (err?.errorFields) return; // form validation error
      message.error("Failed to save adjustment.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await sportsService.deleteAdjustment(id);
      message.success("Adjustment deleted.");
      fetchAdjustments();
      onAdjustmentSaved();
    } catch {
      message.error("Failed to delete adjustment.");
    }
  };

  const columns: ColumnsType<CashAdjustment> = [
    {
      title: "Date",
      dataIndex: "effectiveDate",
      key: "effectiveDate",
      width: 110,
      render: (d: string) => <span className="text-xs">{formatDate(d)}</span>,
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      width: 90,
      render: (type: string) => (
        <Tag
          color={type === "increase" ? "green" : "red"}
          icon={type === "increase" ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        >
          {type === "increase" ? "Increase" : "Decrease"}
        </Tag>
      ),
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      width: 130,
      render: (amount: number, record) => (
        <span
          className={`font-medium ${record.type === "increase" ? "text-green-600" : "text-red-600"}`}
        >
          {record.type === "increase" ? "+" : "-"}
          {formatCurrency(amount)}
        </span>
      ),
    },
    {
      title: "Reason",
      dataIndex: "reason",
      key: "reason",
      ellipsis: true,
    },
    {
      title: "By",
      dataIndex: ["creator", "username"],
      key: "creator",
      width: 100,
    },
    {
      title: "",
      key: "action",
      width: 50,
      render: (_, record) => (
        <Popconfirm
          title="Delete this adjustment?"
          description="This will reverse the balance change."
          onConfirm={() => handleDelete(record.id)}
          okText="Delete"
          okType="danger"
          cancelText="Cancel"
        >
          <Button size="small" danger type="text" icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <WarningOutlined className="text-orange-500" />
          <span>Cash Balance Adjustment</span>
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width="min(95vw, 700px)"
      centered
      destroyOnClose
    >
      <Alert
        message="Manual Balance Override"
        description={
          <>
            Use this to reconcile when actual cash on hand doesn&apos;t match the
            calculated balance. Each adjustment is logged with your name and
            reason for audit purposes.
          </>
        }
        type="warning"
        showIcon
        className="mb-4"
      />

      <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
        <div>
          <Text type="secondary" className="text-xs">
            Current Calculated Balance
          </Text>
          <div
            className={`text-lg font-bold ${currentBalance >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {formatCurrency(currentBalance)}
          </div>
        </div>
        {!showForm && (
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              form.resetFields();
              form.setFieldsValue({ type: "increase", effectiveDate: dayjs() });
              setShowForm(true);
            }}
          >
            New Adjustment
          </Button>
        )}
      </div>

      {showForm && (
        <>
          <Divider className="my-3" />
          <div className="p-4 border border-orange-200 rounded-lg bg-orange-50/50 mb-4">
            <Text strong className="mb-3 block">
              New Adjustment
            </Text>
            <Form
              form={form}
              layout="vertical"
              initialValues={{ type: "increase", effectiveDate: dayjs() }}
              size="middle"
            >
              <Form.Item
                name="type"
                label="Adjustment Type"
                rules={[{ required: true }]}
              >
                <Radio.Group>
                  <Radio.Button value="increase">
                    <ArrowUpOutlined /> Increase (add money)
                  </Radio.Button>
                  <Radio.Button value="decrease">
                    <ArrowDownOutlined /> Decrease (remove money)
                  </Radio.Button>
                </Radio.Group>
              </Form.Item>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
                <Form.Item
                  name="amount"
                  label="Amount (Rp)"
                  rules={[
                    { required: true, message: "Enter the adjustment amount" },
                    {
                      type: "number",
                      min: 1,
                      message: "Amount must be greater than 0",
                    },
                  ]}
                >
                  <InputNumber
                    className="w-full"
                    placeholder="e.g. 500,000"
                    min={1}
                    formatter={currencyFormatter}
                    parser={currencyParser}
                  />
                </Form.Item>

                <Form.Item
                  name="effectiveDate"
                  label="Effective Date"
                  rules={[{ required: true, message: "Select the date" }]}
                >
                  <DatePicker className="w-full" />
                </Form.Item>
              </div>

              <Form.Item
                name="reason"
                label="Reason / Notes"
                rules={[
                  {
                    required: true,
                    message: "Please provide a reason for this adjustment",
                  },
                ]}
              >
                <TextArea
                  rows={2}
                  placeholder="e.g. Reconciliation: actual cash count on Sept 5 was Rp 1,200,000 — adjusting to match."
                  maxLength={500}
                  showCount
                />
              </Form.Item>

              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => setShowForm(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  onClick={handleSubmit}
                  loading={submitting}
                >
                  Save Adjustment
                </Button>
              </div>
            </Form>
          </div>
        </>
      )}

      <Divider className="my-3" />
      <Text strong className="mb-2 block">
        Adjustment History
      </Text>

      <Table
        columns={columns}
        dataSource={adjustments}
        loading={loading}
        rowKey="id"
        size="small"
        pagination={{ pageSize: 5, hideOnSinglePage: true }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No adjustments yet"
            />
          ),
        }}
      />
    </Modal>
  );
}
