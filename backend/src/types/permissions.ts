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

export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: Object.values(PERMISSIONS),
  fcl: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.FCL_VIEW,
    PERMISSIONS.FCL_VIEW_SUMMARY,
    PERMISSIONS.FCL_MANAGE_DELETIONS,
    PERMISSIONS.ATTENDANCE_VIEW,
  ],
  leader: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.FCL_VIEW,
    PERMISSIONS.FCL_MANAGE_MEMBERS,
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ATTENDANCE_MANAGE,
  ],
  sports: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.SPORTS_VIEW,
    PERMISSIONS.SPORTS_MANAGE,
  ],
};

export function getPermissionsForRoles(roleNames: string[]): Permission[] {
  const permissionSet = new Set<Permission>();
  for (const role of roleNames) {
    const perms = ROLE_PERMISSIONS[role];
    if (perms) perms.forEach((p) => permissionSet.add(p));
  }
  return Array.from(permissionSet);
}
