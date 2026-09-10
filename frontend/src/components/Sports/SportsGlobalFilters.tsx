"use client";

import { useEffect, useState } from "react";
import { DatePicker, Select, Input, Card, AutoComplete } from "antd";
import type { Dayjs } from "dayjs";
import { SearchOutlined, FilterOutlined } from "@ant-design/icons";
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
    <Card
      bordered={false}
      className="shadow-sm mb-6 rounded-2xl border border-gray-100"
      styles={{ body: { padding: "16px 20px" } }}
    >
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
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
              placeholder="Search venue or location..."
              prefix={<SearchOutlined className="text-gray-400" />}
              allowClear
              className="rounded-lg"
            />
          </AutoComplete>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <RangePicker
            value={dateRange}
            // @ts-ignore
            onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
            allowClear
            className="w-full sm:w-60 rounded-lg"
          />
          <Select
            value={selectedCategory}
            onChange={setSelectedCategory}
            options={[{ value: "All", label: "All Categories" }, ...CATEGORY_OPTIONS]}
            className="w-36 rounded-lg"
          />
          <Select
            value={selectedCode}
            onChange={setSelectedCode}
            options={[{ value: "All", label: "All Groups" }, ...CODE_OPTIONS]}
            className="w-32 rounded-lg"
          />
        </div>
      </div>
    </Card>
  );
}
