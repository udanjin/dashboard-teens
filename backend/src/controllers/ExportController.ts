import { Controller, Get, Middleware } from "@overnightjs/core";
import { Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/roleAuth";
import { ExportService } from "../services/ExportService";
import { PERMISSIONS } from "../types";
import type { AuthenticatedRequest } from "../types";
import { BadRequestError } from "../errors/AppError";

@Controller("api/fcl")
export class ExportController {
  @Get("export")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.FCL_VIEW_SUMMARY)])
  private async exportExcel(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { startMonth, startYear, endMonth, endYear } = req.query;

      if (!startMonth || !startYear || !endMonth || !endYear) {
        throw new BadRequestError("startMonth, startYear, endMonth, and endYear are required");
      }

      const sm = parseInt(startMonth as string, 10);
      const sy = parseInt(startYear as string, 10);
      const em = parseInt(endMonth as string, 10);
      const ey = parseInt(endYear as string, 10);

      if (isNaN(sm) || isNaN(sy) || isNaN(em) || isNaN(ey)) {
        throw new BadRequestError("Month and year must be valid numbers");
      }

      const buffer = await ExportService.generateFclExcel(sm, sy, em, ey);

      const filename = sm === em && sy === ey
        ? `FCL_Report_${sy}_${String(sm).padStart(2, "0")}.xlsx`
        : `FCL_Report_${sy}_${String(sm).padStart(2, "0")}_to_${ey}_${String(em).padStart(2, "0")}.xlsx`;

      res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      next(error);
    }
  }
}
