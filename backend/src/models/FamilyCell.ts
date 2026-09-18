import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";
import User from "./User";
import Member from "./Member";

class FamilyCell extends Model {
  public id!: number;
  public name!: string;
  public grade!: number;
  public readonly leaders?: User[];
  public readonly members?: Member[];
}

FamilyCell.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    grade: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "family_cells",
  }
);

export default FamilyCell;
