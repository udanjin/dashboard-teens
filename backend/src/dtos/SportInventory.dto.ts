import { z } from "zod";

export const createSportInventorySchema = z.object({
  itemName: z.string().min(1, "Item name is required"),
  category: z.string().min(1, "Category is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  pricePerItem: z.number().min(0, "Price cannot be negative"),
  purchaseDate: z.string().datetime(),
});

export const updateSportInventorySchema = createSportInventorySchema.partial();
