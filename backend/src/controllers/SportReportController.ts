import { Controller, Delete, Get, Middleware, Post, Put } from "@overnightjs/core";
import { Request, Response } from "express";
import SportReport from "../models/SportReport";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/roleAuth";
import { PERMISSIONS } from "../types";
import type { AuthenticatedRequest } from "../types";

@Controller("api/sport-reports")
export class SportReportController {
  @Get("")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.SPORTS_VIEW)])
  private async getAllReports(_req: AuthenticatedRequest, res: Response) {
    try {
      const reports = await SportReport.findAll();
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
      const totalPemasukan = (await SportReport.sum("totalPemasukan")) || 0;
      const totalPengeluaran = (await SportReport.sum("totalPengeluaran")) || 0;
      res.json(totalPemasukan - totalPengeluaran);
    } catch (err) {
      console.error("Cash balance error:", err);
      res.status(500).json({ error: "Failed to calculate cash balance" });
    }
  }

  @Post("")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.SPORTS_MANAGE)])
  private async createReport(req: AuthenticatedRequest, res: Response) {
    try {
      const report = await SportReport.create(req.body);
      res.status(201).json(report);
    } catch (err) {
      console.error("Create report error:", err);
      res.status(400).json({ error: "Failed to create sport report" });
    }
  }

  @Put(":id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.SPORTS_MANAGE)])
  private async updateReport(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;

    try {
      const report = await SportReport.findByPk(id);
      if (!report) {
        return res.status(404).json({ error: "Sport report not found" });
      }

      const updated = await report.update(req.body);
      res.json(updated);
    } catch (err) {
      console.error("Update report error:", err);
      res.status(400).json({ error: "Failed to update report" });
    }
  }

  @Delete(":id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.SPORTS_MANAGE)])
  private async deleteReport(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;

    try {
      const report = await SportReport.findByPk(id);
      if (!report) {
        return res.status(404).json({ error: "Sport report not found" });
      }

      await report.destroy();
      res.json({ message: "Report deleted successfully" });
    } catch (err) {
      console.error("Delete report error:", err);
      res.status(400).json({ error: "Failed to delete report" });
    }
  }
}
