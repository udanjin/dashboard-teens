import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth'; 
import User from '../models/User';
import Role from '../models/Role'; // <-- Import the Role model

export const roleAuthMiddleware = (allowedRoles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // 1. Fetch the user AND their associated roles
      const user = await User.findByPk(userId, {
        include: [{
          model: Role,
          as: 'roles',
          attributes: ['name'] // Only need the role name
        }]
      });

      // 2. Check if the user or their roles exist
      if (!user || !user.roles || user.roles.length === 0) {
        return res.status(403).json({ error: 'Forbidden: No roles assigned' });
      }

      // 3. Extract the names of the user's roles into a simple array
      const userRoleNames = user.roles.map(role => role.name); // e.g., ['fcl', 'leader']

      // 4. Check if the user's roles array has at least one of the allowed roles
      const hasPermission = userRoleNames.some(roleName => allowedRoles.includes(roleName));

      if (hasPermission) {
        next(); // Permission granted, continue
      } else {
        return res.status(403).json({ error: 'Forbidden: You do not have permission for this action' });
      }
    } catch (error) {
      console.error("Role auth error:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};