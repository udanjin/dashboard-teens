"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Table, message } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";

interface DataTableProps<T> {
  columns: ColumnsType<T>;
  dataSource?: T[];
  fetchFn?: () => Promise<T[]>;
  rowKey: string;
  loading?: boolean;
  bordered?: boolean;
  size?: "small" | "middle" | "large";
  scroll?: { x?: number | string; y?: number | string };
  pagination?: false | TablePaginationConfig;
  toolbar?: React.ReactNode;
  title?: string;
}

export function useTableData<T>(fetchFn: () => Promise<T[]>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setData(await fetchFn());
    } catch {
      message.error("Failed to fetch data.");
    } finally {
      setLoading(false);
    }
  }, [fetchFn]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh, setData };
}

export default function DataTable<T extends object>({
  columns,
  dataSource,
  fetchFn,
  rowKey,
  loading: externalLoading,
  bordered = true,
  size = "middle",
  scroll,
  pagination,
  toolbar,
  title,
}: DataTableProps<T>) {
  const internal = useSelfFetch<T>(fetchFn);

  const resolvedData = fetchFn ? internal.data : dataSource ?? [];
  const resolvedLoading = fetchFn ? internal.loading : externalLoading ?? false;

  return (
    <div>
      {(title || toolbar) && (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 gap-3 sm:gap-0">
          {title && <h1 className="text-xl sm:text-2xl font-bold">{title}</h1>}
          {toolbar}
        </div>
      )}
      <div className="bg-white rounded-lg shadow-sm">
        <Table
          columns={columns}
          dataSource={resolvedData as T[]}
          loading={resolvedLoading}
          rowKey={rowKey}
          bordered={bordered}
          size={size}
          scroll={scroll}
          pagination={pagination}
        />
      </div>
    </div>
  );
}

function useSelfFetch<T>(fetchFn?: () => Promise<T[]>) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fetchFn) return;
    let cancelled = false;
    setLoading(true);
    fetchFn()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch(() => {
        if (!cancelled) message.error("Failed to fetch data.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [fetchFn]);

  return { data, loading };
}
