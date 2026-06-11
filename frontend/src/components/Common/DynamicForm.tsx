"use client";

import {
  DatePicker,
  Divider,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
} from "antd";
import type {
  DatePickerProps,
  FormInstance,
  InputNumberProps,
  InputProps,
  SelectProps,
  SwitchProps,
} from "antd";
import type { TextAreaProps } from "antd/es/input";
import type { Rule } from "antd/es/form";
import type { ReactNode } from "react";
import { currencyFormatter, currencyParser, restrictToNumericInput } from "@/lib/formatters";

export type FieldType =
  | "input"
  | "password"
  | "textarea"
  | "datepicker"
  | "select"
  | "switch"
  | "currency"
  | "inputNumber"
  | "divider";

export interface FieldOption {
  value: number | string | null;
  label: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface FieldConfig<T = any> {
  name: keyof T | string;
  label: string;
  rules?: Rule[];
  componentType: FieldType;
  options?: FieldOption[];
  placeholder?: string;
  hidden?: boolean;
  disabled?: boolean;
  valuePropName?: string;
  hasFeedback?: boolean;
  dependencies?: string[];
  props?:
    | InputProps
    | TextAreaProps
    | DatePickerProps
    | SelectProps<number | string | null>
    | SwitchProps
    | InputNumberProps;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface DynamicFormProps<T = any> {
  form: FormInstance<T>;
  fields: FieldConfig<T>[][];
  onFinish: (values: T) => void | Promise<void>;
  onValuesChange?: (changedValues: Partial<T>, allValues: T) => void;
  initialValues?: Partial<T>;
  loading?: boolean;
  footer?: ReactNode;
  children?: ReactNode;
}

function safePlaceholder(p?: string): string | undefined {
  return typeof p === "string" ? p : undefined;
}

function sanitizeOptions(options?: FieldOption[]): FieldOption[] {
  if (!options) return [];
  return options.filter(
    (opt): opt is FieldOption =>
      opt != null &&
      typeof opt.label === "string" &&
      (typeof opt.value === "string" || typeof opt.value === "number" || opt.value === null)
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderComponent<T = any>(field: FieldConfig<T>) {
  const isDisabled = field.disabled;

  switch (field.componentType) {
    case "input":
      return (
        <Input
          placeholder={safePlaceholder(field.placeholder)}
          {...(field.props as InputProps)}
          disabled={isDisabled ?? (field.props as InputProps)?.disabled}
        />
      );
    case "password":
      return (
        <Input.Password
          placeholder={safePlaceholder(field.placeholder)}
          {...(field.props as InputProps)}
          disabled={isDisabled ?? (field.props as InputProps)?.disabled}
        />
      );
    case "inputNumber":
      return (
        <InputNumber
          style={{ width: "100%" }}
          placeholder={safePlaceholder(field.placeholder)}
          formatter={currencyFormatter}
          parser={currencyParser}
          {...(field.props as InputNumberProps)}
          disabled={isDisabled ?? (field.props as InputNumberProps)?.disabled}
        />
      );
    case "currency":
      return (
        <InputNumber
          style={{ width: "100%" }}
          placeholder={safePlaceholder(field.placeholder)}
          onKeyDown={restrictToNumericInput}
          formatter={currencyFormatter}
          parser={currencyParser}
          {...(field.props as InputNumberProps)}
          disabled={isDisabled ?? (field.props as InputNumberProps)?.disabled}
        />
      );
    case "textarea":
      return (
        <Input.TextArea
          placeholder={safePlaceholder(field.placeholder)}
          {...(field.props as TextAreaProps)}
          disabled={isDisabled ?? (field.props as TextAreaProps)?.disabled}
        />
      );
    case "datepicker":
      return (
        <DatePicker
          style={{ width: "100%" }}
          placeholder={safePlaceholder(field.placeholder)}
          {...(field.props as DatePickerProps)}
          disabled={isDisabled ?? (field.props as DatePickerProps)?.disabled}
        />
      );
    case "select":
      return (
        <Select
          options={sanitizeOptions(field.options)}
          placeholder={safePlaceholder(field.placeholder)}
          showSearch
          allowClear
          {...(field.props as SelectProps<number | string | null>)}
          disabled={isDisabled ?? (field.props as SelectProps)?.disabled}
        />
      );
    case "switch":
      return (
        <Switch
          {...(field.props as SwitchProps)}
          disabled={isDisabled ?? (field.props as SwitchProps)?.disabled}
        />
      );
    case "divider":
      return <Divider style={{ margin: 0 }}>{field.label}</Divider>;
    default:
      return null;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function DynamicForm<T = any>({
  form,
  fields,
  onFinish,
  onValuesChange,
  initialValues,
  loading = false,
  footer,
  children,
}: DynamicFormProps<T>) {
  const hiddenFields = fields.flat().filter((f) => f.hidden);

  return (
    <Form<T>
      form={form}
      layout="vertical"
      onFinish={onFinish}
      onValuesChange={onValuesChange}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      initialValues={initialValues as any}
      disabled={loading}
    >
      {hiddenFields.map((field) => (
        <Form.Item
          key={String(field.name)}
          name={field.name as string}
          hidden
        >
          <Input />
        </Form.Item>
      ))}

      {fields.map((row, rowIndex) => {
        const visibleFields = row.filter((f) => !f.hidden);
        if (visibleFields.length === 0) return null;

        return (
          <div
            key={rowIndex}
            style={{
              display: "grid",
              gridTemplateColumns:
                visibleFields[0].componentType === "divider"
                  ? "1fr"
                  : `repeat(${visibleFields.length}, 1fr)`,
              gap: 16,
            }}
          >
            {visibleFields.map((field) =>
              field.componentType === "divider" ? (
                <div key={String(field.name)} style={{ marginBottom: 16 }}>
                  {renderComponent(field)}
                </div>
              ) : (
                <Form.Item
                  key={String(field.name)}
                  name={field.name as string}
                  label={field.label}
                  rules={field.rules}
                  valuePropName={
                    field.componentType === "switch" ? "checked" : field.valuePropName
                  }
                  hasFeedback={field.hasFeedback}
                  dependencies={field.dependencies as string[]}
                  style={{
                    marginBottom: rowIndex === fields.length - 1 && !children && !footer ? 0 : 16,
                  }}
                >
                  {renderComponent<T>(field)}
                </Form.Item>
              )
            )}
          </div>
        );
      })}

      {children}
      {footer}
    </Form>
  );
}
