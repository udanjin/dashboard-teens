"use client";

import type { FormInstance } from "antd";
import DynamicForm, { type FieldConfig } from "@/components/Common/DynamicForm";
import FinancialDetailList from "./FinancialDetailList";
import { CODE_OPTIONS, CATEGORY_OPTIONS } from "@/types";

interface SportsEventFormProps {
  form: FormInstance;
  onFinish: (values: Record<string, unknown>) => void | Promise<void>;
  loading?: boolean;
}

const fields: FieldConfig[][] = [
  [{ name: "id", label: "", componentType: "input", hidden: true }],
  [
    {
      name: "date",
      label: "Date",
      componentType: "datepicker",
      rules: [{ required: true, message: "Please select date!" }],
    },
    {
      name: "code",
      label: "Code",
      componentType: "select",
      options: CODE_OPTIONS,
      rules: [{ required: true, message: "Please select code!" }],
    },
    {
      name: "category",
      label: "Sports Category",
      componentType: "select",
      options: CATEGORY_OPTIONS,
      rules: [{ required: true, message: "Please select sport!" }],
    },
    {
      name: "venue",
      label: "Venue",
      componentType: "input",
      placeholder: "e.g. Main Sports Hall",
      rules: [{ required: true, message: "Please input venue!" }],
    },
  ],
  [
    {
      name: "participant",
      label: "Participant",
      componentType: "inputNumber",
      rules: [{ required: true, message: "Please input participant count!" }],
      props: { min: 0 },
    },
  ],
];

export default function SportsEventForm({ form, onFinish, loading }: SportsEventFormProps) {
  return (
    <DynamicForm
      form={form}
      fields={fields}
      onFinish={onFinish}
      loading={loading}
      initialValues={{ expenseDetails: [{}], pemasukanDetails: [{}] }}
    >
      <FinancialDetailList
        name="expenseDetails"
        label="Detail Pengeluaran"
        addButtonLabel="Add Expense Detail"
        placeholder="Keterangan pengeluaran"
      />
      <FinancialDetailList
        name="pemasukanDetails"
        label="Detail Pemasukan"
        addButtonLabel="Add Income Detail"
        placeholder="Keterangan pemasukan"
      />
    </DynamicForm>
  );
}
