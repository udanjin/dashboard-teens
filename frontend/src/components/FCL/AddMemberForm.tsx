"use client";

import { Button, DatePicker, Form, Input } from "antd";
import { PlusOutlined, CloseOutlined } from "@ant-design/icons";
import type { FormInstance } from "antd";
import DynamicForm, { type FieldConfig } from "@/components/Common/DynamicForm";
import type { AddMemberFormValues } from "@/types";

interface AddMemberFormProps {
  form: FormInstance;
  onFinish: (values: AddMemberFormValues) => void | Promise<void>;
  loading?: boolean;
}

const fields: FieldConfig[][] = [
  [
    { name: "grade", label: "Grade", componentType: "inputNumber", disabled: true },
    { name: "gender", label: "Gender", componentType: "input", disabled: true },
  ],
];

export default function AddMemberForm({ form, onFinish, loading }: AddMemberFormProps) {
  return (
    <DynamicForm form={form} fields={fields} onFinish={onFinish} loading={loading}>
      <Form.Item label="Member Details">
        <Form.List name="names">
          {(fieldsList, { add, remove }) => (
            <>
              <div className="space-y-3">
                {fieldsList.map(({ key, name, ...restField }) => (
                  <div key={key} className="flex items-start gap-2">
                    <Form.Item
                      {...restField}
                      name={[name, "name"]}
                      rules={[{ required: true, message: "Please input member's name!" }]}
                      className="flex-1 mb-0"
                    >
                      <Input placeholder="Member's Name" />
                    </Form.Item>
                    <Form.Item
                      {...restField}
                      name={[name, "dob"]}
                      rules={[{ required: true, message: "Please select date of birth!" }]}
                      className="flex-1 mb-0"
                    >
                      <DatePicker placeholder="Date of Birth" className="w-full" />
                    </Form.Item>
                    {fieldsList.length > 1 && (
                      <Button type="text" danger icon={<CloseOutlined />} onClick={() => remove(name)} />
                    )}
                  </div>
                ))}
              </div>
              <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="mt-4">
                Add Another Member
              </Button>
            </>
          )}
        </Form.List>
      </Form.Item>
    </DynamicForm>
  );
}
