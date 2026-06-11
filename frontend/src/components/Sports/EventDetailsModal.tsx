"use client";

import { Modal, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import { formatDate, formatCurrency } from "@/lib/formatters";
import type { SportEvent, FinancialDetail } from "@/types";

interface EventDetailsModalProps {
  event: SportEvent | null;
  open: boolean;
  onClose: () => void;
}

const detailsColumns: ColumnsType<FinancialDetail> = [
  { title: "Keterangan", dataIndex: "keterangan", key: "keterangan", ellipsis: true },
  {
    title: "Jumlah (Rp)",
    dataIndex: "cost",
    key: "cost",
    render: (amount: number) => (typeof amount === "number" ? amount.toLocaleString("id-ID") : 0),
    align: "right",
    width: 120,
  },
];

function DetailTable({
  title,
  data,
  totalColor,
}: {
  title: string;
  data: FinancialDetail[];
  totalColor: string;
}) {
  return (
    <div>
      <h3 className="font-semibold mb-3 text-lg">{title}</h3>
      <Table
        columns={detailsColumns}
        dataSource={data}
        rowKey="id"
        pagination={false}
        bordered
        size="small"
        scroll={{ x: 300 }}
        summary={(pageData) => {
          const total = pageData.reduce((sum, r) => sum + r.cost, 0);
          return (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}><strong>Total</strong></Table.Summary.Cell>
              <Table.Summary.Cell index={1} align="right">
                <strong className={totalColor}>{total.toLocaleString("id-ID")}</strong>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />
    </div>
  );
}

export default function EventDetailsModal({ event, open, onClose }: EventDetailsModalProps) {
  if (!event) return null;

  const netResult = event.totalpemasukan - event.totalpengeluaran;

  return (
    <Modal
      title="Event Details"
      open={open}
      onCancel={onClose}
      footer={null}
      width="min(95vw, 600px)"
      centered
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div><strong>Date:</strong> {formatDate(event.date)}</div>
          <div><strong>Category:</strong> {event.category}</div>
          <div><strong>Venue:</strong> {event.venue}</div>
          <div><strong>Participant:</strong> {event.participant}</div>
        </div>

        <DetailTable title="Detail Pengeluaran" data={event.expenseDetails} totalColor="text-red-500" />
        <DetailTable title="Detail Pemasukan" data={event.pemasukanDetails} totalColor="text-green-500" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
          <div className="text-center p-3 bg-white rounded border-l-4 border-red-500">
            <div className="text-sm text-gray-600">Total Pengeluaran</div>
            <div className="text-lg font-bold text-red-500">{formatCurrency(event.totalpengeluaran)}</div>
          </div>
          <div className="text-center p-3 bg-white rounded border-l-4 border-green-500">
            <div className="text-sm text-gray-600">Total Pemasukan</div>
            <div className="text-lg font-bold text-green-500">{formatCurrency(event.totalpemasukan)}</div>
          </div>
        </div>

        <div className="text-center p-4 bg-white rounded-lg border-2 border-dashed border-gray-300">
          <div className="text-sm text-gray-600 mb-1">Net Result</div>
          <div className={`text-xl font-bold ${netResult >= 0 ? "text-green-600" : "text-red-600"}`}>
            {formatCurrency(netResult)}
          </div>
          <div className="text-xs text-gray-500 mt-1">{netResult >= 0 ? "Profit" : "Loss"}</div>
        </div>
      </div>
    </Modal>
  );
}
