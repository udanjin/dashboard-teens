export interface PendingUser {
  id: string;
  username: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  requestedRoles?: { roles: string[], requestedGrade?: number };
  grade?: number;
  gender?: string;
}

export interface Role {
  id: number;
  name: string;
}

export interface ApprovedUser {
  id: string;
  username: string;
  status: "approved";
  createdAt: string;
  fcId?: number;
  familyCell?: { id: number; name: string; grade: number };
  gender?: string;
  roles?: Role[];
}

export interface ApproveUserPayload {
  roleIds: number[];
  fcId?: number;
  createFc?: boolean;
  fcGrade?: number;
}

export interface UpdateUserPayload {
  roleIds?: number[];
  fcId?: number;
  gender?: string;
}
