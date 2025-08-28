import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: number;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    username: string;
  };
}

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);

    try {
      const decoded = jwt.verify(token, 'your-jwt-secret') as JwtPayload;
      req.user = {
        userId: decoded.userId,
        username: decoded.username,
      };
      next();
    } catch (error) {
      // FIX: Kata 'return' dihapus dari sini
      res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }
  } else {
    // FIX: Kata 'return' juga dihapus dari sini
    res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
};