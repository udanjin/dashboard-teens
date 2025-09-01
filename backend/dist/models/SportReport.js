"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sequelize_1 = require("sequelize");
const db_1 = __importDefault(require("../config/db"));
class SportReport extends sequelize_1.Model {
}
SportReport.init({
    id: {
        type: sequelize_1.DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    date: {
        type: sequelize_1.DataTypes.DATE,
        allowNull: false,
    },
    sportsCategory: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    venue: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    code: {
        type: sequelize_1.DataTypes.STRING,
        allowNull: false,
    },
    participant: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    detailPengeluaran: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
    },
    detailPemasukan: {
        type: sequelize_1.DataTypes.JSONB,
        allowNull: false,
    },
    totalPengeluaran: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
    totalPemasukan: {
        type: sequelize_1.DataTypes.INTEGER,
        allowNull: false,
    },
}, {
    sequelize: db_1.default,
    tableName: 'sport_report',
});
exports.default = SportReport;
