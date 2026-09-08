"use client";

import { useEffect, useState } from "react";
import { Form } from "antd";
import type { FormInstance } from "antd";
import DynamicForm, { type FieldConfig } from "@/components/Common/DynamicForm";
import FinancialDetailList from "./FinancialDetailList";
import { CODE_OPTIONS, CATEGORY_OPTIONS } from "@/types";
import { sportsService } from "@/services";

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
      name: "chipInAmount",
      label: "Chip-in per person (Rp)",
      componentType: "inputNumber",
      rules: [{ required: true, message: "Required" }],
      props: { min: 0 },
    },
    {
      name: "participant",
      label: "Attendees Count",
      componentType: "inputNumber",
      rules: [{ required: true, message: "Required" }],
      props: { min: 0 },
    },
    {
      name: "absenteesCount",
      label: "Absentees Count",
      componentType: "inputNumber",
      rules: [{ required: true, message: "Required" }],
      props: { min: 0 },
    },
  ],
];

export default function SportsEventForm({ form, onFinish, loading }: SportsEventFormProps) {
  const [venueOptions, setVenueOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    sportsService.getVenues().then((venues) => {
      setVenueOptions(venues.map((v) => ({ value: v, label: v })));
    }).catch(console.error);
  }, []);

  const dynamicFields: FieldConfig[][] = [
    fields[0],
    [
      ...fields[1].slice(0, 3),
      {
        ...fields[1][3],
        componentType: "autocomplete",
        options: venueOptions,
      },
    ],
    fields[2],
  ];

  const chipInAmount = Form.useWatch("chipInAmount", form);
  const participant = Form.useWatch("participant", form);
  const absenteesCount = Form.useWatch("absenteesCount", form);

  useEffect(() => {
    if (chipInAmount !== undefined && participant !== undefined && absenteesCount !== undefined) {
      const pemasukanDetails = [];
      
      if (participant > 0) {
        pemasukanDetails.push({
          keterangan: `Chip-in Hadir (${participant} org)`,
          cost: participant * chipInAmount,
        });
      }
      
      if (absenteesCount > 0) {
        const penalty = Math.max(0, chipInAmount - 10000);
        pemasukanDetails.push({
          keterangan: `Penalty Tidak Hadir (${absenteesCount} org)`,
          cost: absenteesCount * penalty,
        });
      }

      form.setFieldsValue({ pemasukanDetails });
    }
  }, [chipInAmount, participant, absenteesCount, form]);

  return (
    <DynamicForm
      form={form}
      fields={dynamicFields}
      onFinish={onFinish}
      loading={loading}
      initialValues={{ 
        expenseDetails: [{}], 
        pemasukanDetails: [],
        chipInAmount: 25000,
        participant: 0,
        absenteesCount: 0
      }}
    >
      <FinancialDetailList
        name="expenseDetails"
        label="Detail Pengeluaran"
        addButtonLabel="Add Expense Detail"
        placeholder="Keterangan pengeluaran"
      />
      <FinancialDetailList
        name="pemasukanDetails"
        label="Detail Pemasukan (Auto-calculated)"
        addButtonLabel="Add Income Detail"
        placeholder="Keterangan pemasukan"
        disabled={true}
      />
    </DynamicForm>
  );
}
