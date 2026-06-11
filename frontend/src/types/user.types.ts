export interface PendingUser {
  id: string;
  username: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface Role {
  id: number;
  name: string;
}

export interface ApproveUserPayload {
  roleIds: number[];
}
