import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/db';

class SportReport extends Model {
  public id!: number;
  public date!: Date;
  public sportsCategory!: string;
  public venue!: string;
  public code!: string;
  public participant!: number;
  public detailPengeluaran!: { keterangan: string; cost: number }[];
  public detailPemasukan!: { keterangan: string; cost: number }[];
  public totalPengeluaran!: number;
  public totalPemasukan!: number;
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
  },
  {
    sequelize,
    tableName: 'sport_report',
  }
);

export default SportReport;