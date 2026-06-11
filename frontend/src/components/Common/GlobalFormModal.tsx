"use client";

import React from "react";
import { Modal, Button } from "antd";
import type { FormInstance } from "antd";

interface GlobalFormModalProps {
  open: boolean;
  title: string;
  onCancel: () => void;
  form?: FormInstance;
  confirmLoading?: boolean;
  children: React.ReactNode;
  width?: number | string;
  okText?: string;
  cancelText?: string;
}

export default function GlobalFormModal({
  open,
  title,
  onCancel,
  form,
  confirmLoading = false,
  children,
  width = 600,
  okText = "Save",
  cancelText = "Cancel",
}: GlobalFormModalProps) {
  return (
    <Modal
      title={title}
      open={open}
      onCancel={onCancel}
      width={width}
      centered
      destroyOnClose
      footer={[
        <Button key="cancel" onClick={onCancel} disabled={confirmLoading}>
          {cancelText}
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={confirmLoading}
          onClick={() => form?.submit()}
        >
          {okText}
        </Button>,
      ]}
    >
      {children}
    </Modal>
  );
}
