import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";
import User from "./User";

class Member extends Model {
  public id!: number;
  public name!: string;
  public status!: "active" | "pending_deletion";
  public deletionReason!: string | null;
  public dob!: Date;
   public grade!: number;
  public gender!: string;
  public readonly leaders?: User[]; 
}

Member.init(
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
    gender:{
      type:DataTypes.STRING,
      allowNull:false
    },
    status: {
      type: DataTypes.ENUM("active", "pending_deletion"),
      allowNull: false,
      defaultValue: "active",
    },
    // Definisi kolom alasan penghapusan
    deletionReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dob:{
      type:DataTypes.DATEONLY,
      allowNull:false,
    }
  },
  {
    sequelize,
    tableName: "members",
  }
);

export default Member;
