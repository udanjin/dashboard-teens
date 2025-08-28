'use client'

import { Table, TableProps } from 'antd'
import { useState } from 'react'

interface DataTableProps<T> extends TableProps<T> {
  addButtonText?: string
  onAdd?: () => void
}

export default function DataTable<T extends object>({
  columns,
  dataSource,
  addButtonText = 'Add New',
  onAdd,
  ...props
}: DataTableProps<T>) {
  return (
    <div className="space-y-4">
      {onAdd && (
        <div className="flex justify-end">
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            {addButtonText}
          </button>
        </div>
      )}
      <Table
        columns={columns}
        dataSource={dataSource}
        bordered
        pagination={{ pageSize: 10 }}
        {...props}
      />
    </div>
  )
}