import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import type { Permission, UserRole } from "@/types";

export function useRoleAccess() {
  const { user } = useAuth();

  const hasAccess = useCallback(
    (requiredRoles: UserRole[]): boolean => {
      if (!user?.roles?.length) return false;
      if (user.roles.includes("admin")) return true;
      return user.roles.some((role) => requiredRoles.includes(role as UserRole));
    },
    [user],
  );

  const hasPermission = useCallback(
    (required: Permission | Permission[]): boolean => {
      if (!user?.permissions?.length) return false;
      const perms = Array.isArray(required) ? required : [required];
      return perms.some((p) => user.permissions.includes(p));
    },
    [user],
  );

  const isAdmin = user?.roles?.includes("admin") ?? false;

  return { hasAccess, hasPermission, isAdmin };
}
