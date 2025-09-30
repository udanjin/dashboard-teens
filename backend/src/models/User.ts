import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";
import Role from "./Role";

class User extends Model {
  public id!: number;
  public username!: string;
  public password!: string;
  public status!: "pending" | "approved" | "rejected";
  public grade!: number;
  public gender!: "Laki-Laki" | "Perempuan";
  public readonly roles?: Role[];
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Ensure unique username
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      allowNull: false,
      defaultValue: "pending",
    },
    grade: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM("Laki-laki", "Perempuan"),
      allowNull: true,
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: "users",
  }
);

export default User;
