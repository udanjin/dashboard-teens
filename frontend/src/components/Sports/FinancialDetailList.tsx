"use client";

import { Button, Form, Input, InputNumber } from "antd";
import { PlusOutlined, CloseOutlined } from "@ant-design/icons";
import { currencyFormatter, currencyParser } from "@/lib/formatters";

interface FinancialDetailListProps {
  name: string;
  label: string;
  addButtonLabel: string;
  placeholder: string;
}

export default function FinancialDetailList({
  name,
  label,
  addButtonLabel,
  placeholder,
}: FinancialDetailListProps) {
  return (
    <Form.Item label={label}>
      <Form.List name={name}>
        {(fields, { add, remove }) => (
          <>
            <div className="mb-4 space-y-3">
              {fields.map(({ key, name: fieldName, ...restField }) => (
                <div key={key} className="flex flex-col sm:flex-row gap-2 items-start">
                  <Form.Item
                    {...restField}
                    name={[fieldName, "keterangan"]}
                    rules={[{ required: true, message: "Masukkan keterangan" }]}
                    className="flex-1 mb-0 w-full sm:w-auto"
                  >
                    <Input placeholder={placeholder} />
                  </Form.Item>
                  <Form.Item
                    {...restField}
                    name={[fieldName, "cost"]}
                    rules={[{ required: true, message: "Masukkan jumlah" }]}
                    className="w-full sm:w-40 mb-0"
                  >
                    <InputNumber
                      min={0}
                      placeholder="Jumlah"
                      className="w-full"
                      formatter={currencyFormatter}
                      parser={currencyParser}
                    />
                  </Form.Item>
                  <Button
                    type="text"
                    icon={<CloseOutlined />}
                    onClick={() => remove(fieldName)}
                    className="sm:self-start"
                  />
                </div>
              ))}
            </div>
            <Button type="dashed" icon={<PlusOutlined />} onClick={() => add()} block>
              {addButtonLabel}
            </Button>
          </>
        )}
      </Form.List>
    </Form.Item>
  );
}
