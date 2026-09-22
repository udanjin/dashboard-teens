import { Controller, Get, Middleware } from "@overnightjs/core";
import { Request, Response, NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import { FamilyCell, User } from "../models";

@Controller("api/family-cells")
export class FamilyCellController {
  @Get()
  @Middleware([authMiddleware])
  private async getAllFamilyCells(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const familyCells = await FamilyCell.findAll({
        attributes: ["id", "name", "grade"],
        include: [
          {
            model: User,
            as: "leaders",
            attributes: ["gender"],
            where: { status: "approved" },
            required: false,
          },
        ],
        order: [["grade", "ASC"], ["name", "ASC"]],
      });

      const mapped = familyCells.map((fc: any) => {
        const fcObj = fc.toJSON();
        return {
          id: fcObj.id,
          name: fcObj.name,
          grade: fcObj.grade,
          gender: fcObj.leaders && fcObj.leaders.length > 0 ? fcObj.leaders[0].gender : null,
        };
      });

      res.json(mapped);
    } catch (err) {
      next(err);
    }
  }
}
