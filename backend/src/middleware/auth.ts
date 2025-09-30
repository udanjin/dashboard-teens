import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: number;
  username: string;
  name: string;
  roles: string[];
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export const authMiddleware = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    console.log("Extracted token:", token);
    console.log("JWT_SECRET exists:", !!process.env.JWT_SECRET);
    console.log("Middleware JWT_SECRET:", process.env.JWT_SECRET);
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      req.user = decoded;
      next();
    } catch (error) {
      // FIX: Kata 'return' dihapus dari sini
      console.error("JWT verification error:", error);
      res.status(401).json({
        error: "Unauthorized: Invalid token",
        debug: error instanceof Error ? error.message : "Unknown error",
      });
    }
  } else {
    // FIX: Kata 'return' juga dihapus dari sini
    res.status(401).json({ error: "Unauthorized: No token provided" });
  }
};
