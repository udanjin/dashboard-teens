import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors/AppError";
import { ZodError } from "zod";

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: "Validation Error",
      details: (err as any).errors.map((e: any) => ({
        path: e.path.join("."),
        message: e.message,
      })),
    });
    return;
  }

  console.error("Unhandled Error:", err);
  res.status(500).json({ error: "Internal Server Error" });
};
