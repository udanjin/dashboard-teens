import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';

class SportReport extends Model {
  public id!: number;
  public date!: Date;
  public sportsCategory!: string;
  public venue!: string;
  public code!: string;
  public participant!: number;
  public absenteesCount!: number;
  public chipInAmount!: number;
  public penaltyAmount!: number;
  public detailPengeluaran!: { keterangan: string; cost: number }[];
  public detailPemasukan!: { keterangan: string; cost: number }[];
  public totalPengeluaran!: number;
  public totalPemasukan!: number;
  public createdById?: number | null;
}

SportReport.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    sportsCategory: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    venue: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    participant: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    absenteesCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    chipInAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 25000,
    },
    penaltyAmount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 15000,
    },
    detailPengeluaran: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    detailPemasukan: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    totalPengeluaran: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    totalPemasukan: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    createdById: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'sport_report',
  }
);

export default SportReport;