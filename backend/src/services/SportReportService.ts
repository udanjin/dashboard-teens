import { Op, Sequelize } from "sequelize";
import SportReport from "../models/SportReport";
import { NotFoundError } from "../errors/AppError";

interface SportReportFilters {
  startDate?: string;
  endDate?: string;
  category?: string;
  code?: string;
  search?: string;
}

export class SportReportService {
  static async getAllReports(filters: SportReportFilters) {
    const where: any = {};

    if (filters.category && filters.category !== "All") {
      where.sportsCategory = filters.category;
    }

    if (filters.code && filters.code !== "All") {
      where.code = filters.code;
    }

    if (filters.search) {
      where.venue = { [Op.iLike]: `%${filters.search}%` };
    }

    if (filters.startDate && filters.endDate) {
      where.date = {
        [Op.gte]: new Date(filters.startDate),
        [Op.lte]: new Date(filters.endDate),
      };
    }

    // Parallel queries for extreme efficiency
    const [reports, kpiResult] = await Promise.all([
      SportReport.findAll({ where, order: [["date", "DESC"]] }),
      SportReport.findOne({
        where,
        attributes: [
          [Sequelize.fn("SUM", Sequelize.col("totalPemasukan")), "totalIncome"],
          [Sequelize.fn("SUM", Sequelize.col("totalPengeluaran")), "totalExpenses"],
          [Sequelize.fn("SUM", Sequelize.col("participant")), "totalParticipants"],
          [Sequelize.fn("COUNT", Sequelize.col("id")), "totalEvents"],
        ],
        raw: true,
      }),
    ]);

    const kpisRaw = kpiResult as unknown as {
      totalIncome: string | null;
      totalExpenses: string | null;
      totalParticipants: string | null;
      totalEvents: string | null;
    };

    const totalIncome = Number(kpisRaw?.totalIncome) || 0;
    const totalExpenses = Number(kpisRaw?.totalExpenses) || 0;
    const netBalance = totalIncome - totalExpenses;
    const totalParticipants = Number(kpisRaw?.totalParticipants) || 0;
    const totalEvents = Number(kpisRaw?.totalEvents) || 0;

    return {
      data: reports,
      kpis: {
        totalIncome,
        totalExpenses,
        netBalance,
        totalParticipants,
        totalEvents,
      },
    };
  }

  static async getUniqueVenues() {
    const venues = await SportReport.findAll({
      attributes: [[Sequelize.fn("DISTINCT", Sequelize.col("venue")), "venue"]],
      raw: true,
      order: [["venue", "ASC"]],
    });
    return venues.map((v: any) => v.venue).filter(Boolean);
  }

  static async createReport(data: any) {
    return await SportReport.create(data);
  }

  static async updateReport(id: number, data: any) {
    const report = await SportReport.findByPk(id);
    if (!report) {
      throw new NotFoundError("Sport report not found");
    }
    return await report.update(data);
  }

  static async deleteReport(id: number) {
    const report = await SportReport.findByPk(id);
    if (!report) {
      throw new NotFoundError("Sport report not found");
    }
    await report.destroy();
  }
}
