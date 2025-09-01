"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Modal,
  Form,
  Input,
  Table,
  Space,
  Select,
  InputNumber,
  Typography,
  Tag,
  message,
  DatePicker,
  Popconfirm,
  InputNumberProps,
  Card,
} from "antd";
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import axiosInstance from "../../lib/axiosInstance";

const { Text } = Typography;

interface Detail {
  id: string;
  keterangan: string;
  cost: number;
}

interface SportEvent {
  id: string;
  code: "C" | "P";
  date: string;
  category: "Basket" | "Futsal" | "Badminton" | "Football";
  venue: string;
  participant: number;
  expenseDetails: Detail[];
  pemasukanDetails: Detail[];
  totalpengeluaran: number;
  totalpemasukan: number;
}

export default function SportsPage() {
  const [data, setData] = useState<SportEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<SportEvent | null>(null);
  const [form] = Form.useForm();

  const CODE_OPTIONS = [
    { value: "C", label: "C" },
    { value: "P", label: "P" },
  ];

  const CATEGORY_OPTIONS = [
    { value: "Basket", label: "Basket" },
    { value: "Futsal", label: "Futsal" },
    { value: "Badminton", label: "Badminton" },
    { value: "Football", label: "Football" },
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/sport-reports");
      const sportTable = res.data.map((item: any, index: number) => ({
        key: item.id || index,
        id: item.id,
        date: item.date,
        code: item.code,
        participant: item.participant,
        venue: item.venue,
        category: item.sportsCategory,
        totalpemasukan: item.totalPemasukan,
        totalpengeluaran: item.totalPengeluaran,
        expenseDetails: (item.detailPengeluaran || []).map(
          (detail: any, detailIndex: number) => ({
            id: detail.id || `${item.id}-expense-${detailIndex}`,
            keterangan: detail.keterangan,
            cost: detail.cost,
          })
        ),
        pemasukanDetails: (item.detailPemasukan || []).map(
          (detail: any, detailIndex: number) => ({
            id: detail.id || `${item.id}-income-${detailIndex}`,
            keterangan: detail.keterangan,
            cost: detail.cost,
          })
        ),
      }));
      setData(sportTable);
    } catch (error) {
      console.error("Failed to fetch events:", error);
      message.error("Failed to load sports data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFinish = async (values: any) => {
    setLoading(true);
    const totalPengeluaran = (values.expenseDetails || []).reduce(
      (sum: number, item: Detail) => sum + (item.cost || 0),
      0
    );
    const totalPemasukan = (values.pemasukanDetails || []).reduce(
      (sum: number, item: Detail) => sum + (item.cost || 0),
      0
    );
    try {
      const payload = {
        ...values,
        date: dayjs(values.date).toISOString(),
        sportsCategory: values.category,
        detailPengeluaran: values.expenseDetails,
        detailPemasukan: values.pemasukanDetails,
        totalPemasukan: totalPemasukan,
        totalPengeluaran: totalPengeluaran,
      };

      if (values.id) {
        await axiosInstance.put(`/sport-reports/${values.id}`, payload);
        message.success("Event updated successfully!");
      } else {
        await axiosInstance.post("/sport-reports", payload);
        message.success("Event added successfully!");
      }

      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error("Failed to save event:", error);
      message.error("Failed to save event.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(true);
    try {
      await axiosInstance.delete(`/sport-reports/${id}`);
      message.success("report deleted");
      fetchData();
    } catch (err) {
      console.error(err);
      message.error("failed to delete report");
    } finally {
      setLoading(false);
    }
  };

  const formatter: InputNumberProps["formatter"] = (value) => {
    return `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  const parser: InputNumberProps["parser"] = (value) => {
    return value!.replace(/\./g, "");
  };

  // Responsive columns dengan width yang lebih spesifik
  const columns: ColumnsType<SportEvent> = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      width: 120,
      render: (date) => (
        <div className="text-xs sm:text-sm whitespace-nowrap">
          {dayjs(date).format("DD MMM YYYY")}
        </div>
      ),
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      responsive: ['sm'],
    },
    {
      title: "Code",
      dataIndex: "code",
      key: "code",
      width: 70,
      render: (code) => (
        <Tag color={code === "C" ? "blue" : "green"} className="text-xs">
          {code}
        </Tag>
      ),
      responsive: ['md'],
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 100,
      filters: CATEGORY_OPTIONS.map((opt) => ({
        text: opt.label,
        value: opt.value,
      })),
      onFilter: (value, record) => record.category === value,
      render: (category) => (
        <span className="text-xs sm:text-sm">{category}</span>
      ),
    },
    {
      title: "Participant",
      dataIndex: "participant",
      key: "participant",
      width: 90,
      responsive: ['lg'],
      render: (participant) => (
        <span className="text-xs sm:text-sm">{participant}</span>
      ),
    },
    {
      title: "Venue",
      dataIndex: "venue",
      key: "venue",
      width: 150,
      responsive: ['md'],
      ellipsis: true,
      render: (venue) => (
        <span className="text-xs sm:text-sm" title={venue}>
          {venue}
        </span>
      ),
    },
    {
      title: "Pengeluaran",
      dataIndex: "totalpengeluaran",
      key: "totalpengeluaran",
      width: 120,
      render: (amount) => (
        <div className="text-red-500 font-medium text-xs sm:text-sm whitespace-nowrap">
          Rp {typeof amount === "number" ? amount.toLocaleString("id-ID") : 0}
        </div>
      ),
      sorter: (a, b) => a.totalpengeluaran - b.totalpengeluaran,
      responsive: ['sm'],
    },
    {
      title: "Pemasukan",
      dataIndex: "totalpemasukan",
      key: "totalpemasukan",
      width: 120,
      render: (amount) => (
        <div className="text-green-500 font-medium text-xs sm:text-sm whitespace-nowrap">
          Rp {typeof amount === "number" ? amount.toLocaleString("id-ID") : 0}
        </div>
      ),
      sorter: (a, b) => a.totalpemasukan - b.totalpemasukan,
      responsive: ['sm'],
    },
    {
      title: "Action",
      key: "action",
      fixed: 'right',
      width: 120,
      render: (_, record) => (
        <div className="flex gap-1">
          <Button
            size="small"
            type="text"
            icon={<EyeOutlined />}
            className="text-blue-500 p-1"
            onClick={() => {
              setSelectedEvent(record);
              setIsDetailsModalOpen(true);
            }}
          />
          <Button
            size="small"
            icon={<EditOutlined />}
            className="p-1"
            onClick={() => {
              form.setFieldsValue({
                ...record,
                date: dayjs(record.date),
                pemasukanDetails: record.pemasukanDetails,
              });
              setIsModalOpen(true);
            }}
          />
          <Popconfirm
            title="Delete event?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button size="small" danger icon={<DeleteOutlined />} className="p-1" />
          </Popconfirm>
        </div>
      ),
    },
  ];

  const detailsColumns: ColumnsType<Detail> = [
    {
      title: "Keterangan",
      dataIndex: "keterangan",
      key: "keterangan",
      ellipsis: true,
    },
    {
      title: "Jumlah (Rp)",
      dataIndex: "cost",
      key: "cost",
      render: (amount) =>
        typeof amount === "number" ? amount.toLocaleString("id-ID") : 0,
      align: "right",
      width: 120,
    },
  ];

  return (
    <div className="w-full">
      {/* Header section - responsive */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold">Sports Events</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            form.resetFields();
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto"
        >
          Add Event
        </Button>
      </div>

      {/* Table with responsive card wrapper for mobile */}
      <div className="bg-white rounded-lg shadow-sm">
        <Table
          columns={columns}
          dataSource={data}
          loading={loading}
          rowKey="key"
          bordered
          pagination={{ 
            pageSize: 20,
            showSizeChanger: false,
            showQuickJumper: false,
            responsive: true,
          }}
          scroll={{ x: 800 }}
          size="small"
        />
      </div>

      {/* Add/Edit Modal - responsive */}
      <Modal
        title={form.getFieldValue("id") ? "Edit Event" : "Add New Event"}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
        destroyOnClose
        width="min(95vw, 800px)"
        centered
      >
        <Form
          form={form}
          name="event_form"
          onFinish={handleFinish}
          layout="vertical"
          autoComplete="off"
          initialValues={{
            expenseDetails: [{}],
            pemasukanDetails: [{}],
          }}
        >
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          
          {/* Responsive grid layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Form.Item
              name="date"
              label="Date"
              rules={[{ required: true, message: "Please select date!" }]}
            >
              <DatePicker className="w-full" />
            </Form.Item>
            <Form.Item
              name="code"
              label="Code"
              rules={[{ required: true, message: "Please select code (C/P)!" }]}
            >
              <Select options={CODE_OPTIONS} className="w-full" />
            </Form.Item>
            <Form.Item
              name="category"
              label="Sports Category"
              rules={[{ required: true, message: "Please select sport!" }]}
            >
              <Select options={CATEGORY_OPTIONS} className="w-full" />
            </Form.Item>
            <Form.Item
              name="venue"
              label="Venue"
              rules={[{ required: true, message: "Please input venue!" }]}
            >
              <Input placeholder="e.g. Main Sports Hall" className="w-full" />
            </Form.Item>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <Form.Item
              name="participant"
              label="Participant"
              rules={[{ required: true, message: "Please input participant count!" }]}
            >
              <InputNumber min={0} className="w-full" />
            </Form.Item>
          </div>

          {/* Expense Details */}
          <Form.Item label="Detail Pengeluaran">
            <Form.List name="expenseDetails">
              {(fields, { add, remove }) => (
                <>
                  <div className="mb-4 space-y-3">
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} className="flex flex-col sm:flex-row gap-2 items-start">
                        <Form.Item
                          {...restField}
                          name={[name, "keterangan"]}
                          rules={[
                            { required: true, message: "Masukkan keterangan" },
                          ]}
                          className="flex-1 mb-0 w-full sm:w-auto"
                        >
                          <Input placeholder="Keterangan pengeluaran" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, "cost"]}
                          rules={[
                            { required: true, message: "Masukkan jumlah" },
                          ]}
                          className="w-full sm:w-40 mb-0"
                        >
                          <InputNumber
                            min={0}
                            placeholder="Jumlah"
                            className="w-full"
                            formatter={formatter}
                            parser={parser}
                          />
                        </Form.Item>
                        <Button
                          type="text"
                          icon={<CloseOutlined />}
                          onClick={() => remove(name)}
                          className="sm:self-start"
                        />
                      </div>
                    ))}
                  </div>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add()}
                    block
                  >
                    Add Expense Detail
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          {/* Income Details */}
          <Form.Item label="Detail Pemasukan">
            <Form.List name="pemasukanDetails">
              {(fields, { add, remove }) => (
                <>
                  <div className="mb-4 space-y-3">
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} className="flex flex-col sm:flex-row gap-2 items-start">
                        <Form.Item
                          {...restField}
                          name={[name, "keterangan"]}
                          rules={[
                            { required: true, message: "Masukkan keterangan" },
                          ]}
                          className="flex-1 mb-0 w-full sm:w-auto"
                        >
                          <Input placeholder="Keterangan pemasukan" />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, "cost"]}
                          rules={[
                            { required: true, message: "Masukkan jumlah" },
                          ]}
                          className="w-full sm:w-40 mb-0"
                        >
                          <InputNumber
                            min={0}
                            placeholder="Jumlah"
                            className="w-full"
                            formatter={formatter}
                            parser={parser}
                          />
                        </Form.Item>
                        <Button
                          type="text"
                          icon={<CloseOutlined />}
                          onClick={() => remove(name)}
                          className="sm:self-start"
                        />
                      </div>
                    ))}
                  </div>
                  <Button
                    type="dashed"
                    icon={<PlusOutlined />}
                    onClick={() => add()}
                    block
                  >
                    Add Income Detail
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
            <Button onClick={() => setIsModalOpen(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button type="primary" htmlType="submit" className="w-full sm:w-auto">
              Save Event
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Details Modal - responsive */}
      <Modal
        title="Event Details"
        open={isDetailsModalOpen}
        onCancel={() => setIsDetailsModalOpen(false)}
        footer={null}
        width="min(95vw, 600px)"
        centered
      >
        {selectedEvent && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <strong>Date:</strong>{" "}
                {dayjs(selectedEvent.date).format("DD MMM YYYY")}
              </div>
              <div>
                <strong>Category:</strong> {selectedEvent.category}
              </div>
              <div>
                <strong>Venue:</strong> {selectedEvent.venue}
              </div>
              <div>
                <strong>Participant:</strong> {selectedEvent.participant}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-lg">Detail Pengeluaran</h3>
              <Table
                columns={detailsColumns}
                dataSource={selectedEvent.expenseDetails}
                rowKey="id"
                pagination={false}
                bordered
                size="small"
                scroll={{ x: 300 }}
                summary={(pageData) => {
                  const total = pageData.reduce(
                    (sum, record) => sum + record.cost,
                    0
                  );
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <strong>Total</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <strong className="text-red-500">
                          {total.toLocaleString("id-ID")}
                        </strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  );
                }}
              />
            </div>

            <div>
              <h3 className="font-semibold mb-3 text-lg">Detail Pemasukan</h3>
              <Table
                columns={detailsColumns}
                dataSource={selectedEvent.pemasukanDetails}
                rowKey="id"
                pagination={false}
                bordered
                size="small"
                scroll={{ x: 300 }}
                summary={(pageData) => {
                  const total = pageData.reduce(
                    (sum, record) => sum + record.cost,
                    0
                  );
                  return (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0}>
                        <strong>Total</strong>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={1} align="right">
                        <strong className="text-green-500">
                          {total.toLocaleString("id-ID")}
                        </strong>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  );
                }}
              />
            </div>

            {/* Summary section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="text-center p-3 bg-white rounded border-l-4 border-red-500">
                <div className="text-sm text-gray-600">Total Pengeluaran</div>
                <div className="text-lg font-bold text-red-500">
                  Rp {selectedEvent.totalpengeluaran.toLocaleString("id-ID")}
                </div>
              </div>
              <div className="text-center p-3 bg-white rounded border-l-4 border-green-500">
                <div className="text-sm text-gray-600">Total Pemasukan</div>
                <div className="text-lg font-bold text-green-500">
                  Rp {selectedEvent.totalpemasukan.toLocaleString("id-ID")}
                </div>
              </div>
            </div>

            {/* Net result */}
            <div className="text-center p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-sm text-gray-600 mb-1">Net Result</div>
              <div className={`text-xl font-bold ${
                (selectedEvent.totalpemasukan - selectedEvent.totalpengeluaran) >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                Rp {(selectedEvent.totalpemasukan - selectedEvent.totalpengeluaran).toLocaleString("id-ID")}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {(selectedEvent.totalpemasukan - selectedEvent.totalpengeluaran) >= 0 ? 'Profit' : 'Loss'}
              </div>
            </div>
          </div>
        )}
      </Modal>


    </div>
  );
}