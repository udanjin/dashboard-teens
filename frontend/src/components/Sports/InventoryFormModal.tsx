import React from "react";
import { Form, Input, InputNumber, DatePicker } from "antd";
import type { FormInstance } from "antd";

interface Props {
  form: FormInstance;
  onFinish: (values: Record<string, any>) => void;
  loading: boolean;
}

export default function InventoryFormModal({ form, onFinish, loading }: Props) {
  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{ quantity: 1, pricePerItem: 0 }}
      className="mt-4"
    >
      <Form.Item name="id" hidden>
        <Input />
      </Form.Item>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Form.Item
          name="itemName"
          label={<span className="text-gray-700 font-medium">Item Name</span>}
          rules={[{ required: true, message: "Please enter item name" }]}
        >
          <Input placeholder="e.g. Mikasa Volley Ball" className="h-10 rounded-lg" />
        </Form.Item>

        <Form.Item
          name="category"
          label={<span className="text-gray-700 font-medium">Category</span>}
          rules={[{ required: true, message: "Please enter a category" }]}
        >
          <Input placeholder="e.g. General, Badminton, Futsal" className="h-10 rounded-lg" />
        </Form.Item>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Form.Item
          name="quantity"
          label={<span className="text-gray-700 font-medium">Quantity</span>}
          rules={[{ required: true, message: "Quantity is required" }]}
        >
          <InputNumber min={1} className="w-full h-10 rounded-lg" />
        </Form.Item>

        <Form.Item
          name="pricePerItem"
          label={<span className="text-gray-700 font-medium">Price Per Item</span>}
          rules={[{ required: true, message: "Price is required" }]}
        >
          <InputNumber<number>
            min={0}
            style={{ width: "100%" }}
            prefix="Rp"
          />
        </Form.Item>
      </div>

      <Form.Item
        name="purchaseDate"
        label={<span className="text-gray-700 font-medium">Purchase Date</span>}
        rules={[{ required: true, message: "Purchase date is required" }]}
      >
        <DatePicker className="w-full h-10 rounded-lg" format="YYYY-MM-DD" />
      </Form.Item>
    </Form>
  );
}
