import { Controller, Delete, Get, Middleware, Post, Put } from "@overnightjs/core";
import { Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/roleAuth";
import { SportReportService } from "../services/SportReportService";
import { getSportReportsSchema, createSportReportSchema, updateSportReportSchema } from "../dtos/SportReport.dto";
import { PERMISSIONS } from "../types";
import type { AuthenticatedRequest } from "../types";

@Controller("api/sport-reports")
export class SportReportController {
  @Get("")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.SPORTS_VIEW)])
  private async getAllReports(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const filters = getSportReportsSchema.parse(req.query);
      const result = await SportReportService.getAllReports(filters);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  @Get("venues")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.SPORTS_VIEW)])
  private async getVenues(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const venues = await SportReportService.getUniqueVenues();
      res.json(venues);
    } catch (err) {
      next(err);
    }
  }

  // The separate cash-balance endpoint is no longer strictly needed since KPIs are returned in getAllReports,
  // but we can keep it around if other parts of the app rely on it.
  @Get("cash-balance")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.SPORTS_VIEW)])
  private async getCash(_req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      // Just reuse the service method with empty filters
      const result = await SportReportService.getAllReports({});
      res.json(result.kpis.netBalance);
    } catch (err) {
      next(err);
    }
  }

  @Post("")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.SPORTS_MANAGE)])
  private async createReport(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = createSportReportSchema.parse(req.body);
      const report = await SportReportService.createReport(data);
      res.status(201).json(report);
    } catch (err) {
      next(err);
    }
  }

  @Put(":id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.SPORTS_MANAGE)])
  private async updateReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const data = updateSportReportSchema.parse(req.body);
      const updated = await SportReportService.updateReport(id, data);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  @Delete(":id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.SPORTS_MANAGE)])
  private async deleteReport(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await SportReportService.deleteReport(id);
      res.json({ message: "Report deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
}

