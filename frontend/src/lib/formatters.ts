import type { InputNumberProps } from "antd";
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";

export function formatCurrency(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}

export function formatDate(date: string | Dayjs, format = "DD MMM YYYY"): string {
  return dayjs(date).format(format);
}

export const currencyFormatter: InputNumberProps["formatter"] = (value) =>
  `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".");

export const currencyParser: InputNumberProps["parser"] = (value) =>
  value!.replace(/\./g, "");

export function getSundaysOfMonth(date: Dayjs): Dayjs[] {
  const sundays: Dayjs[] = [];
  const start = date.startOf("month");
  let currentSunday = start.day(7);
  if (currentSunday.date() > 7) {
    currentSunday = currentSunday.subtract(7, "day");
  }
  while (currentSunday.month() === start.month()) {
    sundays.push(currentSunday);
    currentSunday = currentSunday.add(7, "day");
  }
  return sundays;
}

export function sumCosts(items: { cost: number }[]): number {
  return items.reduce((sum, item) => sum + (item.cost || 0), 0);
}

export function restrictToNumericInput(e: React.KeyboardEvent<HTMLInputElement>) {
  const allowed = ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End"];
  if (allowed.includes(e.key) || e.ctrlKey || e.metaKey) return;
  if (!/^\d$/.test(e.key)) e.preventDefault();
}
