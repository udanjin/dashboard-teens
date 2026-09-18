import { Controller, Get, Middleware } from "@overnightjs/core";
import { Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import { FamilyCell } from "../models";

@Controller("api/family-cells")
export class FamilyCellController {
  @Get()
  @Middleware([authMiddleware])
  private async getAllFamilyCells(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const familyCells = await FamilyCell.findAll({
        attributes: ["id", "name", "grade"],
        order: [["grade", "ASC"], ["name", "ASC"]],
      });
      res.json(familyCells);
    } catch (err) {
      next(err);
    }
  }
}
