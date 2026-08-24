"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Table, message } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";

interface DataTableProps<T> {
  columns: ColumnsType<T>;
  dataSource?: T[];
  rowKey: string;
  loading?: boolean;
  bordered?: boolean;
  size?: "small" | "middle" | "large";
  scroll?: { x?: number | string; y?: number | string };
  pagination?: false | TablePaginationConfig;
  toolbar?: React.ReactNode;
  title?: string;
}


export default function DataTable<T extends object>({
  columns,
  dataSource,
  rowKey,
  loading = false,
  bordered = true,
  size = "middle",
  scroll,
  pagination,
  toolbar,
  title,
}: DataTableProps<T>) {

  return (
    <div>
      {(title || toolbar) && (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8 gap-4 sm:gap-0">
          {title && <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h1>}
          {toolbar}
        </div>
      )}
      <div className="rounded-[2rem] p-1.5 ring-1 ring-black/5 dark:ring-white/10 bg-white/50 dark:bg-black/20 backdrop-blur-3xl">
        <div className="bg-white dark:bg-[#050505] rounded-[calc(2rem-0.375rem)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden">
          <Table
          columns={columns}
          dataSource={dataSource ?? []}
          loading={loading}
          rowKey={rowKey}
          bordered={bordered}
          size={size}
          scroll={scroll}
          pagination={pagination}
        />
        </div>
      </div>
    </div>
  );
}

