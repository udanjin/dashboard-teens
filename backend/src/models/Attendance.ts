import { DataTypes, Model } from "sequelize";
import sequelize from "../config/db";

class Attendance extends Model {
  public id!: number;
  public memberId!: number;
  public leaderId!: number;
  public date!: Date;
  public status!: number;
}

Attendance.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    memberId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "members",
        key: "id",
      },
    },
    leaderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.INTEGER,
      allowNull: false,
      
    },
  },
  {
    sequelize,
    tableName: "attendances",
    indexes: [
      {
        unique: true,
        fields: ["memberId", "leaderId", "date"],
      },
    ],
  }
);

export default Attendance;
