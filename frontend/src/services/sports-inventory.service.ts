import axiosInstance from "@/lib/axiosInstance";
import type { 
  SportInventory, 
  SportInventoryFilters, 
  CreateSportInventoryPayload, 
  UpdateSportInventoryPayload 
} from "@/types/sports-inventory.types";

export const sportsInventoryService = {
  async getAll(params?: SportInventoryFilters): Promise<SportInventory[]> {
    const res = await axiosInstance.get<SportInventory[]>("/sport-inventory", { params });
    return res.data;
  },

  async getCategories(): Promise<string[]> {
    const res = await axiosInstance.get<string[]>("/sport-inventory/categories");
    return res.data;
  },

  async create(payload: CreateSportInventoryPayload): Promise<SportInventory> {
    const res = await axiosInstance.post<SportInventory>("/sport-inventory", payload);
    return res.data;
  },

  async update(id: number, payload: UpdateSportInventoryPayload): Promise<SportInventory> {
    const res = await axiosInstance.put<SportInventory>(`/sport-inventory/${id}`, payload);
    return res.data;
  },

  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`/sport-inventory/${id}`);
  },
};
