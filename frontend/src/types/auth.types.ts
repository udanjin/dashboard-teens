export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard:view",

  FCL_VIEW: "fcl:view",
  FCL_MANAGE_MEMBERS: "fcl:manage_members",
  FCL_VIEW_SUMMARY: "fcl:view_summary",
  FCL_MANAGE_DELETIONS: "fcl:manage_deletions",

  SPORTS_VIEW: "sports:view",
  SPORTS_MANAGE: "sports:manage",

  ATTENDANCE_VIEW: "attendance:view",
  ATTENDANCE_MANAGE: "attendance:manage",

  APPROVAL_VIEW: "approval:view",
  APPROVAL_MANAGE: "approval:manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export interface UserInfo {
  id: number;
  name: string;
  username: string;
  roles: string[];
  permissions: Permission[];
  grade?: number;
  gender?: string;
}

export interface LoginResponse {
  message: string;
  user: UserInfo;
}

export interface RegisterRequest {
  accountType: "member" | "leader";
  username: string;
  password: string;
  dob: string | null;
  gender?: string;
  grade?: number;
}

export type UserRole = "admin" | "fcl" | "leader" | "sports";
