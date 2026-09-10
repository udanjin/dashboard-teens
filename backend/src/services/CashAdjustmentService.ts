import { Op, Sequelize } from "sequelize";
import CashAdjustment from "../models/CashAdjustment";
import User from "../models/User";
import { NotFoundError } from "../errors/AppError";

interface CashAdjustmentFilters {
  startDate?: string;
  endDate?: string;
}

export class CashAdjustmentService {
  static async getAllAdjustments(filters: CashAdjustmentFilters) {
    const where: any = {};

    if (filters.startDate && filters.endDate) {
      where.effectiveDate = {
        [Op.gte]: new Date(filters.startDate),
        [Op.lte]: new Date(filters.endDate),
      };
    }

    const adjustments = await CashAdjustment.findAll({
      where,
      order: [["effectiveDate", "DESC"]],
      include: [{ model: User, as: "creator", attributes: ["username"] }],
    });

    return adjustments;
  }

  /**
   * Returns the net sum of all adjustments (increases minus decreases).
   * Used by SportReportService to include in the balance calculation.
   */
  static async getNetAdjustment(): Promise<number> {
    const result = await CashAdjustment.findOne({
      attributes: [
        [
          Sequelize.literal(
            `COALESCE(SUM(CASE WHEN "type" = 'increase' THEN "amount" ELSE 0 END), 0) - ` +
            `COALESCE(SUM(CASE WHEN "type" = 'decrease' THEN "amount" ELSE 0 END), 0)`
          ),
          "netAdjustment",
        ],
      ],
      raw: true,
    });

    return Number((result as any)?.netAdjustment) || 0;
  }

  static async createAdjustment(data: {
    type: "increase" | "decrease";
    amount: number;
    reason: string;
    effectiveDate: string;
    createdById?: number;
  }) {
    return await CashAdjustment.create(data);
  }

  static async deleteAdjustment(id: number) {
    const adjustment = await CashAdjustment.findByPk(id);
    if (!adjustment) {
      throw new NotFoundError("Cash adjustment not found");
    }
    await adjustment.destroy();
  }
}
