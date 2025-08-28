"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Form,
  Input,
  Select,
  Table,
  message,
  Card,
  Typography,
  InputNumber,
  Modal,
  DatePicker,
} from "antd";
import { PlusOutlined, CloseOutlined, UserOutlined, SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
// Corrected: Changed path alias to a relative path to resolve the module.
import axiosInstance from "@/lib/axiosInstance";
// Corrected: Changed path alias to a relative path to resolve the module.
import { useAuth } from "@/context/AuthContext";
import dayjs from "dayjs";
import "dayjs/locale/id";
dayjs.locale("id");

const { Title, Text } = Typography;
const { Option } = Select;

interface Member {
  id: number;
  name: string;
  grade: number;
  gender: string;
}

// status sekarang bisa null, 0 (hadir), atau 1 (tidak hadir)
interface AttendanceRecord {
  memberId: number;
  name: string;
  status: number | null;
}

// Komponen Tombol Absensi yang bisa berubah
const AttendanceButton = ({ status, onClick }: { status: number | null, onClick: () => void }) => {
  let text = "Unmarked";
  let type: "default" | "primary" | "dashed" = "default";

  if (status === 0) {
    text = "Present";
    type = "primary";
  } else if (status === 1) {
    text = "Absent";
    type = "dashed";
  }

  return <Button onClick={onClick} type={type} danger={status === 1}>{text}</Button>;
};

export default function FclPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [searchText, setSearchQuery] = useState('');
  const [form] = Form.useForm();
  const { user } = useAuth();
  
  const [attendanceDate, setAttendanceDate] = useState(dayjs());
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/fcl/my-members");
      setMembers(response.data);
      setFilteredMembers(response.data);
    } catch (error) {
      message.error("Failed to fetch members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);
  
  useEffect(() => {
    const filtered = members.filter(member =>
      member.name.toLowerCase().includes(searchText.toLowerCase())
    );
    setFilteredMembers(filtered);
  }, [searchText, members]);

  const handleAddMemberFinish = async (values: any) => {
    setLoading(true);
    const membersData = values.names.map((item: { name: string }) => ({
      name: item.name,
      grade: values.grade,
      gender: values.gender,
    }));
    try {
      await axiosInstance.post("/fcl/members", { membersData });
      message.success("Members added successfully!");
      setIsAddMemberModalOpen(false);
      fetchMembers();
    } catch (error) {
      message.error("Failed to add members.");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAttendanceSheet = async (date: dayjs.Dayjs) => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`/fcl/attendance-sheet?date=${date.format('YYYY-MM-DD')}`);
      setAttendanceData(response.data);
    } catch (error) {
      message.error("Failed to fetch attendance sheet.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleAttendanceClick = () => {
    const today = dayjs();
    setAttendanceDate(today);
    fetchAttendanceSheet(today);
    setIsAttendanceModalOpen(true);
  };

  // Logika baru untuk mengubah status tombol: null -> 0 (present) -> 1 (absent) -> null
  const handleAttendanceChange = (memberId: number) => {
    setAttendanceData(prevData =>
      prevData.map(record => {
        if (record.memberId === memberId) {
          let newStatus: number | null = 0; // Dari null ke present
          if (record.status === 0) newStatus = 1; // Dari present ke absent
          if (record.status === 1) newStatus = null; // Dari absent ke null
          return { ...record, status: newStatus };
        }
        return record;
      })
    );
  };

  const handleAttendanceSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        date: attendanceDate.format('YYYY-MM-DD'),
        attendances: attendanceData.filter(att => att.status !== null), // Hanya kirim yang sudah diabsen
      };
      await axiosInstance.post('/fcl/attendance', payload);
      message.success('Attendance submitted successfully!');
      setIsAttendanceModalOpen(false);
    } catch (error) {
      message.error('Failed to submit attendance.');
    } finally {
      setLoading(false);
    }
  };

  const memberColumns: ColumnsType<Member> = [
    { title: "Name", dataIndex: "name", key: "name", sorter: (a, b) => a.name.localeCompare(b.name) },
    { title: "Grade", dataIndex: "grade", key: "grade", sorter: (a, b) => a.grade - b.grade },
    { title: "Gender", dataIndex: "gender", key: "gender" },
  ];

  const attendanceColumns: ColumnsType<AttendanceRecord> = [
    { title: 'Nama', dataIndex: 'name', key: 'name' },
    {
      title: 'Status',
      key: 'status',
      render: (_, record) => (
        <AttendanceButton 
          status={record.status} 
          onClick={() => handleAttendanceChange(record.memberId)}
        />
      ),
    },
  ];

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div>
          <Title level={2} className="mb-0">FCL Management</Title>
          <Text type="secondary">Leader: {user?.username}</Text>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search Member"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button onClick={handleAttendanceClick}>Take Attendance</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddMemberModalOpen(true)}>
            Add Member
          </Button>
        </div>
      </div>

      <Table columns={memberColumns} dataSource={filteredMembers} loading={loading} rowKey="id" bordered />

      <Modal
        title="Add New Members"
        open={isAddMemberModalOpen}
        onCancel={() => setIsAddMemberModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleAddMemberFinish} initialValues={{ names: [{ name: '' }] }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item name="grade" label="Grade" rules={[{ required: true, message: "Please input the grade!" }]}>
              <InputNumber placeholder="e.g., 10" className="w-full" />
            </Form.Item>
            <Form.Item name="gender" label="Gender" rules={[{ required: true, message: "Please select a gender!" }]}>
              <Select placeholder="Select a gender">
                <Option value="Laki-laki">Laki-laki</Option>
                <Option value="Perempuan">Perempuan</Option>
              </Select>
            </Form.Item>
          </div>
          <Form.Item label="Member Names">
            <Form.List name="names">
              {(fields, { add, remove }) => (
                <>
                  <div className="space-y-3">
                    {fields.map(({ key, name, ...restField }) => (
                      <div key={key} className="flex items-baseline gap-2">
                        <Form.Item {...restField} name={[name, "name"]} rules={[{ required: true, message: "Please input member's name!" }]} className="flex-1 mb-0">
                          <Input placeholder="Member's Name" />
                        </Form.Item>
                        {fields.length > 1 && <Button type="text" danger icon={<CloseOutlined />} onClick={() => remove(name)} />}
                      </div>
                    ))}
                  </div>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />} className="mt-4">
                    Add Another Member
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>
          <Form.Item className="text-right mb-0">
            <Button onClick={() => setIsAddMemberModalOpen(false)} className="mr-2">Cancel</Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Submit
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Take Attendance"
        open={isAttendanceModalOpen}
        onCancel={() => setIsAttendanceModalOpen(false)}
        onOk={handleAttendanceSubmit}
        width={600}
        confirmLoading={loading}
      >
        <div className="flex items-center gap-4 mb-4">
            <Text>Date:</Text>
            <DatePicker 
                value={attendanceDate} 
                onChange={(date) => {
                    if (date) {
                        setAttendanceDate(date);
                        fetchAttendanceSheet(date);
                    }
                }}
            />
        </div>
        <Table
          columns={attendanceColumns}
          dataSource={attendanceData}
          rowKey="memberId"
          bordered
          pagination={false}
          loading={loading}
        />
      </Modal>
    </div>
  );
}
