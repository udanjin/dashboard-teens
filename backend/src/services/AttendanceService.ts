import { Op, Sequelize } from "sequelize";
import sequelize from "../config/db";
import dayjs from "dayjs";
import User from "../models/User";
import Member from "../models/Member";
import Attendance from "../models/Attendance";

export class AttendanceService {
  static async getSheet(leaderId: number, date: string) {
    const leader = await User.findByPk(leaderId, {
      include: [{ model: Member, as: "members", attributes: ["id", "name"] }],
    });

    if (!leader) throw new Error("Leader not found");

    const members = (leader as any).members || [];
    const memberIds = members.map((m: Member) => m.id);

    const existingAttendances = await Attendance.findAll({
      where: { memberId: { [Op.in]: memberIds }, leaderId, date },
    });

    const attendanceSheet = members.map((member: Member) => {
      const record = existingAttendances.find((a) => a.memberId === member.id);
      return {
        memberId: member.id,
        name: member.name,
        status: record ? record.status : null,
      };
    });

    return attendanceSheet;
  }

  static async submitAttendance(leaderId: number, date: string, attendances: any[]) {
    const transaction = await sequelize.transaction();

    try {
      const toDelete = attendances
        .filter((att: any) => att.status === null)
        .map((att: any) => att.memberId);

      const toUpsert = attendances
        .filter((att: any) => att.status !== null)
        .map((att: any) => ({
          leaderId,
          memberId: att.memberId,
          date,
          status: att.status,
        }));

      if (toDelete.length > 0) {
        await Attendance.destroy({
          where: { leaderId, date, memberId: { [Op.in]: toDelete } },
          transaction,
        });
      }

      if (toUpsert.length > 0) {
        await Attendance.bulkCreate(toUpsert, {
          updateOnDuplicate: ["status"],
          transaction,
        });
      }

      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  static async getSingleAttendance(leaderId: number, month: string, year: string) {
    const startDate = dayjs(`${year}-${month}-01`).startOf("month");
    const endDate = startDate.endOf("month");

    const leader = await User.findByPk(leaderId, {
      include: [{ model: Member, as: "members", attributes: ["id", "name"] }],
    });

    if (!leader) throw new Error("Leader not found");

    const members = (leader as any).members || [];
    if (members.length === 0) return [];

    const memberIds = members.map((m: Member) => m.id);

    const attendanceCount = await Attendance.findAll({
      attributes: [
        "memberId",
        "status",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
      ],
      where: {
        leaderId,
        memberId: { [Op.in]: memberIds },
        status: { [Op.in]: [0, 1] },
        date: {
          [Op.between]: [
            startDate.format("YYYY-MM-DD"),
            endDate.format("YYYY-MM-DD"),
          ],
        },
      },
      group: ["memberId", "status"],
      raw: true,
    });

    const memberStats = members.map((member: Member) => {
      let presentCount = 0;
      let absentCount = 0;

      const records = (attendanceCount as any[]).filter(
        (p) => p.memberId === member.id,
      );

      records.forEach((record) => {
        if (record.status === 0) presentCount = parseInt(record.count, 10);
        else if (record.status === 1) absentCount = parseInt(record.count, 10);
      });

      return { memberId: member.id, name: member.name, presentCount, absentCount };
    });

    return memberStats;
  }
}
