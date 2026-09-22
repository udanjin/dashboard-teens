import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

class AttendanceHistory extends Model {
  public id!: number;
  public memberId!: number;
  public date!: string | Date;
  public updatedBy!: number;
  public action!: "Created" | "Updated" | "Deleted";
  public oldStatus!: number | null;
  public newStatus!: number | null;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

AttendanceHistory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    memberId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    updatedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    action: {
      type: DataTypes.ENUM("Created", "Updated", "Deleted"),
      allowNull: false,
    },
    oldStatus: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    newStatus: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "attendance_history",
  }
);

export default AttendanceHistory;
