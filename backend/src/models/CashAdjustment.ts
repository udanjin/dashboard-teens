import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';

class CashAdjustment extends Model {
  public id!: number;
  public type!: 'increase' | 'decrease';
  public amount!: number;
  public reason!: string;
  public effectiveDate!: Date;
  public createdById?: number | null;
}

CashAdjustment.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM('increase', 'decrease'),
      allowNull: false,
    },
    amount: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    effectiveDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'cash_adjustment',
  }
);

export default CashAdjustment;
