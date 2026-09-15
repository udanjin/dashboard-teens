import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

class SportInventory extends Model {
  public id!: number;
  public itemName!: string;
  public category!: string;
  public quantity!: number;
  public pricePerItem!: number;
  public totalCost!: number;
  public purchaseDate!: Date;
  public createdById?: number | null;
}

SportInventory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    itemName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    category: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    pricePerItem: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    totalCost: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    purchaseDate: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "sport_inventory",
  }
);

export default SportInventory;
