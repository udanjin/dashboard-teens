"use client";

import { useState, useEffect, useRef } from "react";
import { Table, Button, Modal, Typography, DatePicker, message, Spin, Select, Space, Card } from "antd";
import type { ColumnsType } from "antd/es/table";
import axiosInstance from "../../lib/axiosInstance";
import dayjs from "dayjs";
import Chart from 'chart.js/auto';

const { Title } = Typography;
const { Option } = Select;

// --- Interface Definitions ---
interface MemberStat {
  id: number; name: string; grade: number; gender: string; presentCount: number; absentCount: number;
}
interface LeaderSummary {
  leaderId: number; leaderName: string; members: MemberStat[];
}

// --- Komponen Chart ---
function FclAttendanceChart({ filterDate, selectedGender, selectedGrade, selectedLeaderName }: { 
  filterDate: dayjs.Dayjs, 
  selectedGender: string | null,
  selectedGrade: number | null,
  selectedLeaderName: string | null
}) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [chartData, setChartData] = useState<{ labels: string[]; data: number[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          month: String(filterDate.month() + 1),
          year: String(filterDate.year()),
        });
        if (selectedGender) params.append('gender', selectedGender);
        if (selectedGrade) params.append('grade', String(selectedGrade));
        if (selectedLeaderName) params.append('leaderName', selectedLeaderName);

        const response = await axiosInstance.get(`/fcl/weekly-stats?${params.toString()}`);
        setChartData(response.data);
      } catch (error) {
        message.error("Failed to fetch chart data.");
      } finally {
        setLoading(false);
      }
    };
    fetchChartData();
  }, [filterDate, selectedGender, selectedGrade, selectedLeaderName]);

  useEffect(() => {
    if (chartRef.current && chartData) {
      if (chartInstance.current) chartInstance.current.destroy();
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: chartData.labels,
            datasets: [{
              label: 'Total Kehadiran per Minggu',
              data: chartData.data,
              backgroundColor: 'rgba(75, 192, 192, 0.6)',
              borderColor: 'rgba(75, 192, 192, 1)',
              borderWidth: 1
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
          }
        });
      }
    }
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [chartData]);

  return (
    <Card>
      <Title level={4}>Weekly Attendance Chart ({filterDate.format('MMMM YYYY')})</Title>
      <div style={{ height: '300px' }}>
        {loading ? <div className="flex items-center justify-center h-full"><Spin /></div> : <canvas ref={chartRef}></canvas>}
      </div>
    </Card>
  );
}

// --- Komponen Utama ---
export default function FclAdminHome() {
  const [summaryData, setSummaryData] = useState<LeaderSummary[]>([]);
  const [filteredData, setFilteredData] = useState<LeaderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLeader, setSelectedLeader] = useState<LeaderSummary | null>(null);
  
  const [filterDate, setFilterDate] = useState(dayjs());
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [selectedLeaderName, setSelectedLeaderName] = useState<string | null>(null);

  const [gradeOptions, setGradeOptions] = useState<{ value: number; label: string }[]>([]);
  const [leaderOptions, setLeaderOptions] = useState<{ value: string; label: string }[]>([]);

  const fetchSummaryData = async (date: dayjs.Dayjs) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/fcl/fcl-summary?month=${date.month() + 1}&year=${date.year()}`);
      setSummaryData(response.data);
    } catch (error) {
      message.error("Failed to fetch FCL summary data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummaryData(filterDate);
  }, [filterDate]);

  // Efek untuk memperbarui opsi filter dan data tabel
  useEffect(() => {
    let tempFilteredData = [...summaryData];

    // Filter berdasarkan gender
    if (selectedGender) {
      tempFilteredData = tempFilteredData
        .map(leader => ({ ...leader, members: leader.members.filter(m => m.gender === selectedGender) }))
        .filter(leader => leader.members.length > 0);
    }
    const availableGrades = [...new Set(tempFilteredData.flatMap(l => l.members.map(m => m.grade)))].sort((a, b) => a - b);
    setGradeOptions(availableGrades.map(g => ({ value: g, label: `Grade ${g}` })));

    // Filter berdasarkan kelas
    if (selectedGrade) {
      tempFilteredData = tempFilteredData
        .map(leader => ({ ...leader, members: leader.members.filter(m => m.grade === selectedGrade) }))
        .filter(leader => leader.members.length > 0);
    }
    const availableLeaders = [...new Set(tempFilteredData.map(l => l.leaderName))];
    setLeaderOptions(availableLeaders.map(l => ({ value: l, label: l })));

    // Filter berdasarkan leader
    if (selectedLeaderName) {
      tempFilteredData = tempFilteredData.filter(l => l.leaderName === selectedLeaderName);
    }
    
    setFilteredData(tempFilteredData);
  }, [selectedGender, selectedGrade, selectedLeaderName, summaryData]);

  const handleDetailsClick = (leader: LeaderSummary) => {
    setSelectedLeader(leader);
    setIsModalOpen(true);
  };

  const leaderColumns: ColumnsType<LeaderSummary> = [
    { title: "Leader Name", dataIndex: "leaderName", key: "leaderName" },
    { 
      title: "Grade", 
      key: "grade",
      render: (_, record) => {
        if (record.members.length === 0) return 'N/A';
        const grades = [...new Set(record.members.map(m => m.grade))];
        return grades.length === 1 ? grades[0] : `${Math.min(...grades)} - ${Math.max(...grades)}`;
      }
    },
    { 
      title: "Gender", 
      key: "gender",
      render: (_, record) => record.members.length ? record.members[0].gender : 'N/A'
    },
    { title: "Total Members", key: "totalMembers", render: (_, record) => record.members.length },
    { title: "Action", key: "action", render: (_, record) => <Button onClick={() => handleDetailsClick(record)}>Details</Button> },
  ];
  
  const memberDetailColumns: ColumnsType<MemberStat> = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Grade", dataIndex: "grade", key: "grade" },
    { title: "Gender", dataIndex: "gender", key: "gender" },
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
            <DatePicker picker="month" value={filterDate} onChange={(date) => {
              if (date) {
                setFilterDate(date);
                setSelectedGender(null);
                setSelectedGrade(null);
                setSelectedLeaderName(null);
              }
            }} />
            <Select
              placeholder="Filter by Gender"
              allowClear
              style={{ width: 150 }}
              value={selectedGender}
              onChange={(value) => {
                setSelectedGender(value);
                setSelectedGrade(null);
                setSelectedLeaderName(null);
              }}
            >
              <Option value="Laki-laki">Laki-laki</Option>
              <Option value="Perempuan">Perempuan</Option>
            </Select>
            <Select
              placeholder="Filter by Grade"
              allowClear
              style={{ width: 120 }}
              value={selectedGrade}
              options={gradeOptions}
              onChange={(value) => {
                setSelectedGrade(value);
                setSelectedLeaderName(null);
              }}
            />
            <Select
              placeholder="Filter by Leader"
              allowClear
              style={{ width: 200 }}
              value={selectedLeaderName}
              options={leaderOptions}
              onChange={(value) => setSelectedLeaderName(value)}
            />
          </Space>
        </div>
        <div className="overflow-x-auto">
          <Table columns={leaderColumns} dataSource={filteredData} loading={loading} rowKey="leaderId" bordered />
        </div>
        <Modal title={`Details for ${selectedLeader?.leaderName}`} open={isModalOpen} onCancel={() => setIsModalOpen(false)} footer={null} width={800}>
          <Table columns={memberDetailColumns} dataSource={selectedLeader?.members} rowKey="id" bordered pagination={false} scroll={{ x: 'max-content' }} />
        </Modal>
      </div>
    </Space>
  );
}
