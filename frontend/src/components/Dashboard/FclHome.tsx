"use client";

import { useState, useEffect, useRef } from "react";
import {
  Table,
  Button,
  Modal,
  Typography,
  DatePicker,
  message,
  Spin,
  Select,
  Space,
  Card,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { fclService } from "@/services";
import dayjs from "dayjs";
import Chart from "chart.js/auto";
import type { FamilyCellSummary, MemberStat } from "@/types";

const { Title } = Typography;
const { Option } = Select;

function FclAttendanceChart({
  filterDate,
  selectedGender,
  selectedGrade,
  selectedLeaderName,
}: {
  filterDate: dayjs.Dayjs;
  selectedGender: string | null;
  selectedGrade: number | null;
  selectedLeaderName: string | null;
}) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [chartData, setChartData] = useState<{ labels: string[]; data: number[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fclService.getWeeklyStats({
          month: filterDate.month() + 1,
          year: filterDate.year(),
          gender: selectedGender,
          grade: selectedGrade,
          leaderName: selectedLeaderName,
        });
        if (!controller.signal.aborted) {
          setChartData(res.data);
        }
      } catch (err: any) {
        if (err.name !== "CanceledError") {
          message.error("Failed to fetch chart data.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    fetchData();
    return () => controller.abort();
  }, [filterDate, selectedGender, selectedGrade, selectedLeaderName]);

  useEffect(() => {
    if (!chartRef.current || !chartData) return;
    if (chartInstance.current) chartInstance.current.destroy();

    const ctx = chartRef.current.getContext("2d");
    if (ctx) {
      chartInstance.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels: chartData.labels,
          datasets: [
            {
              label: "Total Kehadiran per Minggu",
              data: chartData.data,
              backgroundColor: "rgba(75, 192, 192, 0.6)",
              borderColor: "rgba(75, 192, 192, 1)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } },
        },
      });
    }
    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, [chartData]);

  return (
    <Card>
      <Title level={4}>Weekly Attendance Chart ({filterDate.format("MMMM YYYY")})</Title>
      <div style={{ height: "300px" }}>
        {loading ? (
          <div className="flex items-center justify-center h-full"><Spin /></div>
        ) : (
          <canvas ref={chartRef} />
        )}
      </div>
    </Card>
  );
}

export default function FclAdminHome() {
  const [summaryData, setSummaryData] = useState<FamilyCellSummary[]>([]);
  const [filteredData, setFilteredData] = useState<FamilyCellSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFamilyCell, setSelectedFamilyCell] = useState<FamilyCellSummary | null>(null);

  const [filterDate, setFilterDate] = useState(dayjs());
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedLeaderName, setSelectedLeaderName] = useState<string | null>(null);

  const [gradeOptions, setGradeOptions] = useState<{ value: number; label: string }[]>([]);
  const [leaderOptions, setLeaderOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    const fetchSummary = async () => {
      setLoading(true);
      try {
        const res = await fclService.getSummary(filterDate.month() + 1, filterDate.year());
        if (!controller.signal.aborted) {
          setSummaryData(res.data);
        }
      } catch (err: any) {
        if (err.name !== "CanceledError") {
          message.error("Failed to fetch FCL summary data.");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };
    fetchSummary();
    return () => controller.abort();
  }, [filterDate]);

  useEffect(() => {
    let temp = [...summaryData];

    if (selectedGender) {
      temp = temp.filter((l) => l.gender === selectedGender);
    }
    setGradeOptions(
      [...new Set(temp.map((l) => l.grade).filter(Boolean))].sort((a, b) => a - b).map((g) => ({
        value: g,
        label: `Grade ${g}`,
      }))
    );

    if (selectedGrade) {
      temp = temp.filter((l) => l.grade === selectedGrade);
    }
    setLeaderOptions(
      [...new Set(temp.flatMap((fc) => fc.leaders.map(l => l.name)))].map((n) => ({ value: n, label: n }))
    );

    if (selectedLeaderName) {
      temp = temp.filter((fc) => fc.leaders.some(l => l.name === selectedLeaderName));
    }
    setFilteredData(temp);
  }, [selectedGender, selectedGrade, selectedLeaderName, summaryData]);

  const familyCellColumns: ColumnsType<FamilyCellSummary> = [
    { title: "Family Cell", dataIndex: "fcName", key: "fcName" },
    { title: "Grade", dataIndex: "grade", key: "grade", render: (g: number) => g ?? "N/A" },
    { title: "Gender", dataIndex: "gender", key: "gender", render: (g: string) => g ?? "N/A" },
    { title: "Leaders", key: "leaders", render: (_, r) => r.leaders.map(l => l.name).join(", ") },
    { title: "Total Members", key: "totalMembers", render: (_, r) => r.members.length },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Button onClick={() => { setSelectedFamilyCell(record); setIsModalOpen(true); }}>
          Details
        </Button>
      ),
    },
  ];

  const memberDetailColumns: ColumnsType<MemberStat> = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Date of Birth", dataIndex: "dob", key: "dob" },
    { title: "Phone Number", dataIndex: "phoneNumber", key: "phoneNumber" },
    { title: "Present", dataIndex: "presentCount", key: "presentCount" },
    { title: "Absent", dataIndex: "absentCount", key: "absentCount" },
  ];

  return (
    <Space direction="vertical" size="large" className="w-full">
      <FclAttendanceChart
        filterDate={filterDate}
        selectedGender={selectedGender}
        selectedGrade={selectedGrade}
        selectedLeaderName={selectedLeaderName}
      />
      <div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
          <Title level={3} className="mb-0">FCL Attendance Summary</Title>
          <Space wrap>
            <DatePicker
              picker="month"
              value={filterDate}
              onChange={(date) => {
                if (date) {
                  setFilterDate(date);
                  setSelectedGender(null);
                  setSelectedGrade(null);
                  setSelectedLeaderName(null);
                }
              }}
            />
            <Select
              placeholder="Filter by Gender"
              allowClear
              style={{ width: 150 }}
              value={selectedGender}
              onChange={(v) => { setSelectedGender(v); setSelectedGrade(null); setSelectedLeaderName(null); }}
            >
              <Option value="male">Male</Option>
              <Option value="female">Female</Option>
            </Select>
            <Select
              placeholder="Filter by Grade"
              allowClear
              style={{ width: 120 }}
              value={selectedGrade}
              options={gradeOptions}
              onChange={(v) => { setSelectedGrade(v); setSelectedLeaderName(null); }}
            />
            <Select
              placeholder="Filter by Leader"
              allowClear
              style={{ width: 200 }}
              value={selectedLeaderName}
              options={leaderOptions}
              onChange={(v) => setSelectedLeaderName(v)}
            />
          </Space>
        </div>
        <div className="overflow-x-auto">
          <Table
            columns={familyCellColumns}
            dataSource={filteredData}
            loading={loading}
            rowKey="fcId"
            bordered
          />
        </div>
        <Modal
          title={`Kak ${selectedFamilyCell?.leaders.map(l => l.name).join(" & ")} Member's Detail`}
          open={isModalOpen}
          onCancel={() => setIsModalOpen(false)}
          footer={null}
          width={800}
        >
          {selectedFamilyCell && (
            <Space direction="vertical">
              <Typography.Text><strong>Family Cell: </strong>{selectedFamilyCell.fcName}</Typography.Text>
              <Typography.Text><strong>Gender: </strong>{selectedFamilyCell.gender}</Typography.Text>
              <Typography.Text><strong>Grade: </strong>{selectedFamilyCell.grade}</Typography.Text>
            </Space>
          )}
          <Table
            columns={memberDetailColumns}
            dataSource={selectedFamilyCell?.members}
            rowKey="id"
            bordered
            pagination={false}
            scroll={{ x: "max-content" }}
          />
        </Modal>
      </div>
    </Space>
  );
}
