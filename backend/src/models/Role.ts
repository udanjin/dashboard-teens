import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

class Role extends Model {
  public id!: number;
  public name!: string;
}

Role.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
}, { sequelize, tableName: 'roles', timestamps: false });

export default Role;