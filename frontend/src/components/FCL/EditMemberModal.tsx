"use client";

import { useEffect } from "react";
import { Form, message } from "antd";
import dayjs from "dayjs";
import GlobalFormModal from "@/components/Common/GlobalFormModal";
import DynamicForm, { type FieldConfig } from "@/components/Common/DynamicForm";
import { fclService } from "@/services";
import { useModal } from "@/stores/modalStore";
import type { Member, EditMemberFormValues } from "@/types";

export const EDIT_MEMBER_MODAL_KEY = "edit-member-modal";

const fields: FieldConfig[][] = [
  [
    {
      name: "name",
      label: "Nama Member",
      componentType: "input",
      rules: [{ required: true, message: "Nama tidak boleh kosong" }],
      placeholder: "Masukkan nama member",
    },
  ],
  [
    {
      name: "dob",
      label: "Tanggal Lahir",
      componentType: "datepicker",
      rules: [{ required: true, message: "Tanggal lahir tidak boleh kosong" }],
      props: { className: "w-full" },
    },
  ],
];

interface EditMemberModalProps {
  member: Member | null;
  onSuccess: () => void;
}

export default function EditMemberModal({ member, onSuccess }: EditMemberModalProps) {
  const modal = useModal(EDIT_MEMBER_MODAL_KEY);
  const [form] = Form.useForm<EditMemberFormValues>();

  // Pre-fill form fields whenever a member is selected
  useEffect(() => {
    if (member && modal.isOpen) {
      form.setFieldsValue({
        name: member.name,
        dob: member.dob ? dayjs(member.dob) : undefined,
      });
    }
  }, [member, modal.isOpen, form]);

  const handleFinish = async (values: EditMemberFormValues) => {
    if (!member) return;
    modal.setLoading(true);
    try {
      await fclService.editMember(member.id, {
        name: values.name,
        dob: values.dob.format("YYYY-MM-DD"),
      });
      message.success(`Data member "${values.name}" berhasil diperbarui`);
      modal.close();
      form.resetFields();
      onSuccess();
    } catch (err: any) {
      const errMsg = err?.response?.data?.error ?? "Gagal memperbarui data member";
      message.error(errMsg);
    } finally {
      modal.setLoading(false);
    }
  };

  return (
    <GlobalFormModal
      title={`Edit Member: ${member?.name ?? ""}`}
      open={modal.isOpen}
      onCancel={() => {
        modal.close();
        form.resetFields();
      }}
      form={form}
      confirmLoading={modal.loading}
      okText="Simpan Perubahan"
    >
      <DynamicForm form={form} fields={fields} onFinish={handleFinish} />
    </GlobalFormModal>
  );
}