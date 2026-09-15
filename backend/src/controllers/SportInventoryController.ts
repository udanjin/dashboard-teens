import { Controller, Delete, Get, Middleware, Post, Put } from "@overnightjs/core";
import { Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/roleAuth";
import { SportInventoryService } from "../services/SportInventoryService";
import { createSportInventorySchema, updateSportInventorySchema } from "../dtos/SportInventory.dto";
import { PERMISSIONS } from "../types";
import type { AuthenticatedRequest } from "../types";

@Controller("api/sport-inventory")
export class SportInventoryController {
  @Get("")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.SPORTS_VIEW)])
  private async getAllInventory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const filters = req.query;
      const result = await SportInventoryService.getAllInventory(filters);
      res.json(result);
    } catch (err) {
      next(err);
    }
  }

  @Get("categories")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.SPORTS_VIEW)])
  private async getCategories(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const categories = await SportInventoryService.getUniqueCategories();
      res.json(categories);
    } catch (err) {
      next(err);
    }
  }

  @Post("")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.SPORTS_MANAGE)])
  private async createInventory(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const data = createSportInventorySchema.parse(req.body);
      const payload = { ...data, createdById: req.user!.userId };
      const item = await SportInventoryService.createInventory(payload);
      res.status(201).json(item);
    } catch (err) {
      next(err);
    }
  }

  @Put(":id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.SPORTS_MANAGE)])
  private async updateInventory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const data = updateSportInventorySchema.parse(req.body);
      const updated = await SportInventoryService.updateInventory(id, data);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  @Delete(":id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.SPORTS_MANAGE)])
  private async deleteInventory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      await SportInventoryService.deleteInventory(id);
      res.json({ message: "Inventory deleted successfully" });
    } catch (err) {
      next(err);
    }
  }
}
