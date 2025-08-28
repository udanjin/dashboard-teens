import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

class Member extends Model {
  public id!: number;
  public name!: string;
  public gender!: "Laki-Laki" | "Perempuan";
  public grade!: number;
  public status!: "active" | "pending_deletion";
  public deletionReason!: string | null;
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
    gender: {
      type: DataTypes.ENUM("Laki-laki", "Perempuan"),
      allowNull: false,
    },
    grade: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
  },
  {
    sequelize,
    tableName: "members",
  }
);

export default Member;
