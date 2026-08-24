import { Controller, Get, Middleware, Post } from "@overnightjs/core";
import { Response } from "express";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/roleAuth";
import { validate } from "../middleware/validate";
import { getSheetSchema, submitAttendanceSchema, getSingleAttendanceSchema } from "../validators/attendance.validator";
import { AttendanceService } from "../services/AttendanceService";
import { PERMISSIONS } from "../types";
import type { AuthenticatedRequest } from "../types";

@Controller("api/attendance")
export class AttendanceController {
  @Get("sheet")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.ATTENDANCE_VIEW), validate(getSheetSchema)])
  private async getAttendanceSheet(req: AuthenticatedRequest, res: Response): Promise<any> {
    const leaderId = req.user?.userId;
    const { date } = req.query as { date: string };

    if (!leaderId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const attendanceSheet = await AttendanceService.getSheet(leaderId, date);
      res.json(attendanceSheet);
    } catch (err: any) {
      console.error("Attendance sheet error:", err);
      if (err.message === "Leader not found") return res.status(404).json({ error: err.message });
      res.status(500).json({ error: "Failed to fetch attendance sheet" });
    }
  }

  @Post("")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.ATTENDANCE_MANAGE), validate(submitAttendanceSchema)])
  private async submitAttendance(req: AuthenticatedRequest, res: Response): Promise<any> {
    const leaderId = req.user?.userId;
    const { date, attendances } = req.body;

    if (!leaderId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      await AttendanceService.submitAttendance(leaderId, date, attendances);
      res.json({ message: "Attendance submitted successfully" });
    } catch (err) {
      console.error("Submit attendance error:", err);
      res.status(500).json({ error: "Failed to submit attendance" });
    }
  }

  @Get("single-attendance")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.ATTENDANCE_VIEW), validate(getSingleAttendanceSchema)])
  private async getAllAttendance(req: AuthenticatedRequest, res: Response): Promise<any> {
    const leaderId = req.user?.userId;
    const { month, year } = req.query as { month: string, year: string };

    if (!leaderId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const memberStats = await AttendanceService.getSingleAttendance(leaderId, month, year);
      res.json({ memberStats });
    } catch (err: any) {
      console.error("Single attendance error:", err);
      if (err.message === "Leader not found") return res.status(404).json({ error: err.message });
      res.status(500).json({ error: "Failed to calculate attendance" });
    }
  }
}
