import { Controller, Delete, Get, Middleware, Post } from "@overnightjs/core";
import { Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/roleAuth";
import { CashAdjustmentService } from "../services/CashAdjustmentService";
import { createCashAdjustmentSchema, getCashAdjustmentsSchema } from "../dtos/CashAdjustment.dto";
import { PERMISSIONS } from "../types";
import type { AuthenticatedRequest } from "../types";

@Controller("api/cash-adjustments")
export class CashAdjustmentController {
  @Get("")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.SPORTS_VIEW)])
  private async getAll(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const filters = getCashAdjustmentsSchema.parse(req.query);
      const adjustments = await CashAdjustmentService.getAllAdjustments(filters);
      res.json(adjustments);
    } catch (err) {
      next(err);
    }
  }

  @Post("")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.SPORTS_MANAGE)])
  private async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = createCashAdjustmentSchema.parse(req.body);
      const payload = { ...data, createdById: req.user!.userId };
      const adjustment = await CashAdjustmentService.createAdjustment(payload);
      res.status(201).json(adjustment);
    } catch (err) {
      next(err);
    }
  }

  @Delete(":id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.SPORTS_MANAGE)])
  private async delete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await CashAdjustmentService.deleteAdjustment(id);
      res.json({ message: "Adjustment deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
}
