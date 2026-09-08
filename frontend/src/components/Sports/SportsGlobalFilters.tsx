"use client";

import { useEffect, useState } from "react";
import { DatePicker, Select, Input, Card, AutoComplete } from "antd";
import type { Dayjs } from "dayjs";
import { SearchOutlined } from "@ant-design/icons";
import { CATEGORY_OPTIONS, CODE_OPTIONS } from "@/types";
import { sportsService } from "@/services";

const { RangePicker } = DatePicker;

interface SportsGlobalFiltersProps {
  dateRange: [Dayjs, Dayjs] | null;
  setDateRange: (range: [Dayjs, Dayjs] | null) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  selectedCode: string;
  setSelectedCode: (val: string) => void;
  searchText: string;
  setSearchText: (val: string) => void;
}

export default function SportsGlobalFilters({
  dateRange,
  setDateRange,
  selectedCategory,
  setSelectedCategory,
  selectedCode,
  setSelectedCode,
  searchText,
  setSearchText,
}: SportsGlobalFiltersProps) {
  const [options, setOptions] = useState<{ value: string }[]>([]);

  useEffect(() => {
    sportsService.getVenues().then((venues) => {
      setOptions(venues.map((v) => ({ value: v })));
    }).catch(console.error);
  }, []);

  return (
    <Card bordered={false} className="shadow-sm mb-6" bodyStyle={{ padding: "16px 24px" }}>
      <div className="flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[200px]">
          <AutoComplete
            options={options}
            style={{ width: "100%" }}
            value={searchText}
            onChange={setSearchText}
            onSelect={setSearchText}
            filterOption={(inputValue, option) =>
              option!.value.toUpperCase().indexOf(inputValue.toUpperCase()) !== -1
            }
          >
            <Input
              placeholder="Search venue..."
              prefix={<SearchOutlined className="text-gray-400" />}
              allowClear
            />
          </AutoComplete>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <RangePicker
            value={dateRange}
            // @ts-ignore
            onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
            allowClear
            className="w-60"
          />
          <Select
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={[{ value: "All", label: "All Categories" }, ...CATEGORY_OPTIONS]}
            className="w-40"
          />
          <Select
            value={selectedCode}
            onChange={setSelectedCode}
            options={[{ value: "All", label: "All Codes" }, ...CODE_OPTIONS]}
            className="w-32"
          />
        </div>
      </div>
    </Card>
  );
}
