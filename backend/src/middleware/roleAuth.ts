import { Response, NextFunction } from "express";
import type { AuthenticatedRequest, Permission } from "../types";

export const requirePermission = (required: Permission | Permission[]) => {
  const requiredPerms = Array.isArray(required) ? required : [required];

  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userPerms = req.user?.permissions;

    if (!userPerms?.length) {
      res.status(403).json({ error: "Forbidden: No permissions assigned" });
      return;
    }

    const hasPermission = requiredPerms.some((p) => userPerms.includes(p));

    if (hasPermission) {
      next();
    } else {
      res.status(403).json({ error: "Forbidden: Insufficient permissions" });
    }
  };
};
