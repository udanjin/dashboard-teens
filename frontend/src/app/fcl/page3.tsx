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
  Checkbox,
  DatePicker,
} from "antd";
import { PlusOutlined, CloseOutlined, UserOutlined, SearchOutlined } from "@ant-design/icons";
import type { ColumnsType } from "antd/es/table";
// Corrected: Reverted to the path alias for consistency with your project structure.
import axiosInstance from "@/lib/axiosInstance";
// Corrected: Reverted to the path alias for consistency with your project structure.
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

interface AttendanceRecord {
  memberId: number;
  name: string;
  [date: string]: any; 
}

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
  
  const getSundaysOfMonth = (date: dayjs.Dayjs) => {
    const sundays = [];
    const start = date.startOf('month');
    let currentSunday = start.day(7);
    if (currentSunday.date() > 7) {
        currentSunday = currentSunday.subtract(7, 'day');
    }
    while (currentSunday.month() === start.month()) {
        sundays.push(currentSunday);
        currentSunday = currentSunday.add(7, 'day');
    }
    return sundays;
  };
  
  const fetchAttendanceSheet = async (date: dayjs.Dayjs) => {
    setLoading(true);
    try {
      const membersResponse = await axiosInstance.get("/fcl/my-members");
      const membersList: Member[] = membersResponse.data;
      const sundays = getSundaysOfMonth(date);

      const attendancePromises = sundays.map(sunday =>
        axiosInstance.get(`/fcl/attendance-sheet?date=${sunday.format('YYYY-MM-DD')}`)
      );
      const responses = await Promise.all(attendancePromises);
      const attendanceByDate = responses.map(res => res.data);

      const transformedData = membersList.map(member => {
        const record: AttendanceRecord = {
          memberId: member.id,
          name: member.name,
        };
        sundays.forEach((sunday, index) => {
          const dateKey = sunday.format('YYYY-MM-DD');
          const dailyAttendance = attendanceByDate[index];
          const memberAttendance = dailyAttendance.find((att: any) => att.memberId === member.id);
          record[dateKey] = memberAttendance ? memberAttendance.status : 'absent';
        });
        return record;
      });

      setAttendanceData(transformedData);
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

  const handleAttendanceChange = (memberId: number, dateKey: string, checked: boolean) => {
    setAttendanceData(prevData =>
      prevData.map(record =>
        record.memberId === memberId
          ? { ...record, [dateKey]: checked ? 'present' : 'absent' }
          : record
      )
    );
  };

  const handleAttendanceSubmit = async () => {
    setLoading(true);
    try {
      const attendancesToSubmit = [];
      for (const record of attendanceData) {
        for (const key in record) {
          if (key.startsWith('20')) {
            attendancesToSubmit.push({
              memberId: record.memberId,
              date: key,
              status: record[key],
            });
          }
        }
      }

      const groupedByDate = attendancesToSubmit.reduce((acc, curr) => {
        acc[curr.date] = acc[curr.date] || [];
        acc[curr.date].push({ memberId: curr.memberId, status: curr.status });
        return acc;
      }, {} as any);

      for (const date in groupedByDate) {
        const payload = {
          date: date,
          attendances: groupedByDate[date],
        };
        await axiosInstance.post('/fcl/attendance', payload);
      }

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
  
  const sundays = getSundaysOfMonth(attendanceDate);

  const attendanceColumns: ColumnsType<AttendanceRecord> = [
    { title: 'Nama', dataIndex: 'name', key: 'name', fixed: 'left', width: 150 },
    ...sundays.map(sunday => {
        const dateKey = sunday.format('YYYY-MM-DD');
        return {
            title: sunday.format('D MMM'),
            key: dateKey,
            dataIndex: dateKey,
            render: (_: any, record: AttendanceRecord) => (
                <Checkbox
                    checked={record[dateKey] === 'present'}
                    onChange={(e) => handleAttendanceChange(record.memberId, dateKey, e.target.checked)}
                />
            ),
            align: 'center' as const,
        }
    })
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

      <Table
        columns={memberColumns}
        dataSource={filteredMembers}
        loading={loading}
        rowKey="id"
        bordered
      />

      <Modal
        title="Add New Members"
        open={isAddMemberModalOpen}
        onCancel={() => setIsAddMemberModalOpen(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleAddMemberFinish}
          initialValues={{ names: [{ name: '' }] }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="grade"
              label="Grade"
              rules={[{ required: true, message: "Please input the grade!" }]}
            >
              <InputNumber placeholder="e.g., 10" className="w-full" />
            </Form.Item>
            <Form.Item
              name="gender"
              label="Gender"
              rules={[{ required: true, message: "Please select a gender!" }]}
            >
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
                        <Form.Item
                          {...restField}
                          name={[name, "name"]}
                          rules={[{ required: true, message: "Please input member's name!" }]}
                          className="flex-1 mb-0"
                        >
                          <Input placeholder="Member's Name" />
                        </Form.Item>
                        {fields.length > 1 && (
                          <Button
                            type="text"
                            danger
                            icon={<CloseOutlined />}
                            onClick={() => remove(name)}
                          />
                        )}
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
        width={1000}
        confirmLoading={loading}
      >
        <div className="flex items-center gap-4 mb-4">
            <Text>Month:</Text>
            <DatePicker 
                picker="month" 
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
          scroll={{ x: 'max-content' }}
          loading={loading}
        />
      </Modal>
    </div>
  );
}
