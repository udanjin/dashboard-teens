import type { Dayjs } from "dayjs";

export interface Member {
  id: number;
  name: string;
  dob?: string | null;
  presentCount: number;
  absentCount: number;
}

export interface MemberStat {
  id: number;
  name: string;
  grade: number;
  gender: string;
  presentCount: number;
  absentCount: number;
  dob: string;
}

export interface LeaderSummary {
  leaderId: number;
  leaderName: string;
  gender: string;
  grade: number;
  members: MemberStat[];
}

export interface AttendanceRecord {
  memberId: number;
  name: string;
  [date: string]: string | number | null;
}

export interface AttendancePayload {
  date: string;
  attendances: { memberId: number; status: number | null }[];
}

export interface AttendanceSheetEntry {
  memberId: number;
  status: number;
}

export interface SingleAttendanceStats {
  memberStats: {
    memberId: number;
    presentCount: number;
    absentCount: number;
  }[];
}

export interface WeeklyStatsResponse {
  labels: string[];
  data: number[];
}

export interface Birthday {
  date: string;
  name: string;
  type: "User" | "Member";
}

export interface DeletionRequest {
  id: number;
  name: string;
  deletionReason: string;
}

export interface AddMemberData {
  name: string;
  dob: string | null;
  grade: number;
  gender: string;
}

export interface AddMemberFormValues {
  names: { name: string; dob: Dayjs }[];
}
