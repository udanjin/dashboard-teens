import SportReport from "../models/SportReport";

export class SportReportService {
  static async getAllReports() {
    return SportReport.findAll();
  }

  static async getCashBalance() {
    const totalPemasukan = (await SportReport.sum("totalPemasukan")) || 0;
    const totalPengeluaran = (await SportReport.sum("totalPengeluaran")) || 0;
    return totalPemasukan - totalPengeluaran;
  }

  static async createReport(data: any) {
    return SportReport.create(data);
  }

  static async updateReport(id: number, data: any) {
    const report = await SportReport.findByPk(id);
    if (!report) {
      throw new Error("Sport report not found");
    }
    return report.update(data);
  }

  static async deleteReport(id: number) {
    const report = await SportReport.findByPk(id);
    if (!report) {
      throw new Error("Sport report not found");
    }
    await report.destroy();
  }
}
