import { Controller, Get, Middleware, Post } from "@overnightjs/core";
import { Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/roleAuth";
import { AttendanceService } from "../services/AttendanceService";
import { getAttendanceSheetSchema, submitAttendanceSchema, getSingleAttendanceSchema } from "../dtos/Attendance.dto";
import { PERMISSIONS } from "../types";
import type { AuthenticatedRequest } from "../types";
import { BadRequestError } from "../errors/AppError";

@Controller("api/attendance")
export class AttendanceController {
  @Get("sheet")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.ATTENDANCE_VIEW)])
  private async getAttendanceSheet(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const leaderId = req.user?.userId;
      if (!leaderId) throw new BadRequestError("Leader ID is missing from token");

      const { date } = getAttendanceSheetSchema.parse(req.query);
      const attendanceSheet = await AttendanceService.getAttendanceSheet(leaderId, date);
      res.json(attendanceSheet);
    } catch (err) {
      next(err);
    }
  }

  @Post("")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.ATTENDANCE_MANAGE)])
  private async submitAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const leaderId = req.user?.userId;
      if (!leaderId) throw new BadRequestError("Leader ID is missing from token");

      const { date, attendances } = submitAttendanceSchema.parse(req.body);
      const result = await AttendanceService.submitAttendance(leaderId, date, attendances);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  @Get("single-attendance")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.ATTENDANCE_VIEW)])
  private async getAllAttendance(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const leaderId = req.user?.userId;
      if (!leaderId) throw new BadRequestError("Leader ID is missing from token");

      const { month, year } = getSingleAttendanceSchema.parse(req.query);
      const result = await AttendanceService.getAllAttendance(leaderId, month, year);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }
}

