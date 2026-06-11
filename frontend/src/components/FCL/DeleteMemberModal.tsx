"use client";

import { Form, message } from "antd";
import type { FormInstance } from "antd";
import GlobalFormModal from "@/components/Common/GlobalFormModal";
import DynamicForm, { type FieldConfig } from "@/components/Common/DynamicForm";
import { fclService } from "@/services";
import type { Member } from "@/types";

interface DeleteMemberModalProps {
  member: Member | null;
  open: boolean;
  onClose: () => void;
  onDeleted: () => void;
}

const fields: FieldConfig[][] = [
  [
    {
      name: "reason",
      label: "Reason for deletion",
      componentType: "textarea",
      placeholder: "Reason for deletion (required)",
      rules: [{ required: true, message: "Reason is required" }],
      props: { rows: 4 },
    },
  ],
];

export default function DeleteMemberModal({
  member,
  open,
  onClose,
  onDeleted,
}: DeleteMemberModalProps) {
  const [form] = Form.useForm<{ reason: string }>();

  const handleFinish = async (values: { reason: string }) => {
    if (!member) return;
    try {
      await fclService.requestDeleteMember(member.id, values.reason);
      message.success("Deletion request submitted for approval.");
      form.resetFields();
      onClose();
      onDeleted();
    } catch {
      message.error("Failed to submit deletion request.");
    }
  };

  return (
    <GlobalFormModal
      title={member ? `Request to Delete ${member.name}` : "Request to Delete Member"}
      open={open}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      form={form}
      okText="Submit Request"
    >
      <p className="mb-4">
        Are you sure you want to request the deletion of this member? Please provide a reason below.
      </p>
      <DynamicForm form={form} fields={fields} onFinish={handleFinish} />
    </GlobalFormModal>
  );
}
