import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";
import Role from "./Role";

class User extends Model {
  public id!: number;
  public username!: string;
  public name!: string | null;
  public password!: string;
  public status!: "pending" | "approved" | "rejected";
  public fcId!: number | null;
  public gender!: "Male" | "Female";
  public dob!: Date | string;
  public requestedRoles!: string[] | null;
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
    name: {
      type: DataTypes.STRING,
      allowNull: true,
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
    fcId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM("Male", "Female"),
      allowNull: true,
    },
    dob: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    requestedRoles: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "users",
  }
);

export default User;
