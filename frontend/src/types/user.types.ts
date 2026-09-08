export interface PendingUser {
  id: string;
  username: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  requestedRoles?: string[];
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
  grade?: number;
  gender?: string;
  roles?: Role[];
}

export interface ApproveUserPayload {
  roleIds: number[];
}

export interface UpdateUserPayload {
  roleIds?: number[];
  grade?: number;
  gender?: string;
}
