import { Response, NextFunction } from 'express';
// Impor AuthenticatedRequest dari file authMiddleware Anda
import { AuthenticatedRequest } from './auth'; 
import User from '../models/User';

// Middleware ini adalah sebuah fungsi yang mengembalikan fungsi lain (higher-order function).
// Ini memungkinkan kita untuk memberikan argumen 'allowedRoles' saat menggunakannya.
export const roleAuthMiddleware = (allowedRoles: string[]) => {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const userId = req.user?.userId;

    // Sebenarnya validasi ini sudah dilakukan oleh authMiddleware,
    // tapi ini adalah lapisan pengaman tambahan.
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Cari pengguna di database untuk mendapatkan role-nya
      const user = await User.findByPk(userId);

      // Jika pengguna tidak ditemukan atau tidak memiliki role
      if (!user || !user.role) {
        return res.status(403).json({ error: 'Forbidden: No role assigned' });
      }

      // Periksa apakah role pengguna ada di dalam daftar role yang diizinkan
      if (allowedRoles.includes(user.role)) {
        // Jika diizinkan, lanjutkan ke fungsi controller berikutnya
        next(); 
      } else {
        // Jika tidak, kirim error 403 Forbidden
        return res.status(403).json({ error: 'Forbidden: You do not have permission for this action' });
      }
    } catch (error) {
      console.error("Role auth error:", error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  };
};
