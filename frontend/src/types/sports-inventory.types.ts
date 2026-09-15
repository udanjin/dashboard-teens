export interface SportInventory {
  id: number;
  itemName: string;
  category: string;
  quantity: number;
  pricePerItem: number;
  totalCost: number;
  purchaseDate: string;
  createdById?: number;
  creator?: {
    username: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSportInventoryPayload {
  itemName: string;
  category: string;
  quantity: number;
  pricePerItem: number;
  purchaseDate: string;
}

export interface UpdateSportInventoryPayload extends Partial<CreateSportInventoryPayload> {}

export interface SportInventoryFilters {
  category?: string;
  search?: string;
}
