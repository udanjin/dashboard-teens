import { Op } from "sequelize";
import SportInventory from "../models/SportInventory";
import User from "../models/User";
import { NotFoundError } from "../errors/AppError";

interface SportInventoryFilters {
  category?: string;
  search?: string;
}

export class SportInventoryService {
  static async getAllInventory(filters: SportInventoryFilters) {
    const where: any = {};

    if (filters.category && filters.category !== "All") {
      where.category = filters.category;
    }

    if (filters.search) {
      where.itemName = { [Op.iLike]: `%${filters.search}%` };
    }

    return await SportInventory.findAll({
      where,
      order: [["purchaseDate", "DESC"]],
      include: [{ model: User, as: "creator", attributes: ["username"] }],
    });
  }

  static async getUniqueCategories() {
    const categories = await SportInventory.findAll({
      attributes: [["category", "category"]],
      group: ["category"],
      raw: true,
      order: [["category", "ASC"]],
    });
    return categories.map((c: any) => c.category).filter(Boolean);
  }

  static async createInventory(data: any) {
    const totalCost = data.quantity * data.pricePerItem;
    const payload = { ...data, totalCost };
    return await SportInventory.create(payload);
  }

  static async updateInventory(id: number, data: any) {
    const item = await SportInventory.findByPk(id);
    if (!item) {
      throw new NotFoundError("Sport inventory item not found");
    }

    const payload = { ...data };
    if (data.quantity !== undefined || data.pricePerItem !== undefined) {
      const quantity = data.quantity !== undefined ? data.quantity : item.quantity;
      const pricePerItem = data.pricePerItem !== undefined ? data.pricePerItem : item.pricePerItem;
      payload.totalCost = quantity * pricePerItem;
    }

    return await item.update(payload);
  }

  static async deleteInventory(id: number) {
    const item = await SportInventory.findByPk(id);
    if (!item) {
      throw new NotFoundError("Sport inventory item not found");
    }
    await item.destroy();
  }
}
