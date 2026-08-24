import { Controller, Delete, Get, Middleware, Post, Put } from "@overnightjs/core";
import { Request, Response } from "express";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/roleAuth";
import { validate } from "../middleware/validate";
import { sportReportSchema, updateSportReportSchema } from "../validators/sportReport.validator";
import { SportReportService } from "../services/SportReportService";
import { PERMISSIONS } from "../types";
import type { AuthenticatedRequest } from "../types";

@Controller("api/sport-reports")
export class SportReportController {
  @Get("")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.SPORTS_VIEW)])
  private async getAllReports(_req: AuthenticatedRequest, res: Response) {
    try {
      const reports = await SportReportService.getAllReports();
      res.json(reports);
    } catch (err) {
      console.error("Fetch reports error:", err);
      res.status(500).json({ error: "Failed to fetch sport reports" });
    }
  }

  @Get("cash-balance")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.SPORTS_VIEW)])
  private async getCash(_req: AuthenticatedRequest, res: Response) {
    try {
      const balance = await SportReportService.getCashBalance();
      res.json(balance);
    } catch (err) {
      console.error("Cash balance error:", err);
      res.status(500).json({ error: "Failed to calculate cash balance" });
    }
  }

  @Post("")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.SPORTS_MANAGE), validate(sportReportSchema)])
  private async createReport(req: AuthenticatedRequest, res: Response) {
    try {
      const report = await SportReportService.createReport(req.body);
      res.status(201).json(report);
    } catch (err) {
      console.error("Create report error:", err);
      res.status(400).json({ error: "Failed to create sport report" });
    }
  }

  @Put(":id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.SPORTS_MANAGE), validate(updateSportReportSchema)])
  private async updateReport(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;

    try {
      const updated = await SportReportService.updateReport(parseInt(id, 10), req.body);
      res.json(updated);
    } catch (err: any) {
      console.error("Update report error:", err);
      if (err.message === "Sport report not found") return res.status(404).json({ error: err.message });
      res.status(400).json({ error: "Failed to update report" });
    }
  }

  @Delete(":id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.SPORTS_MANAGE)])
  private async deleteReport(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;

    try {
      await SportReportService.deleteReport(parseInt(id, 10));
      res.json({ message: "Report deleted successfully" });
    } catch (err: any) {
      console.error("Delete report error:", err);
      if (err.message === "Sport report not found") return res.status(404).json({ error: err.message });
      res.status(400).json({ error: "Failed to delete report" });
    }
  }
}
