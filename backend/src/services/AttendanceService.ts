import { Op, Sequelize } from "sequelize";
import sequelize from "../config/db";
import User from "../models/User";
import Member from "../models/Member";
import Attendance from "../models/Attendance";
import { NotFoundError } from "../errors/AppError";
import dayjs from "dayjs";

export class AttendanceService {
  static async getAttendanceSheet(leaderId: number, date: string) {
    const leader = await User.findByPk(leaderId, {
      include: [{ model: Member, as: "members", attributes: ["id", "name"] }],
    });

    if (!leader) throw new NotFoundError("Leader not found");

    const members = (leader as any).members || [];
    const memberIds = members.map((m: Member) => m.id);

    const existingAttendances = await Attendance.findAll({
      where: { memberId: { [Op.in]: memberIds }, date },
    });

    // O(1) Map lookup for performance
    const attendanceMap = new Map<number, number>();
    for (const record of existingAttendances) {
      attendanceMap.set(record.memberId, record.status);
    }

    return members.map((member: Member) => {
      const status = attendanceMap.get(member.id);
      return {
        memberId: member.id,
        name: member.name,
        status: status !== undefined ? status : null,
      };
    });
  }

  static async submitAttendance(leaderId: number, date: string, attendances: any[]) {
    const transaction = await sequelize.transaction();

    try {
      const toDelete = attendances
        .filter((att) => att.status === null)
        .map((att) => att.memberId);

      const toUpsert = attendances
        .filter((att) => att.status !== null)
        .map((att) => ({
          leaderId,
          memberId: att.memberId,
          date,
          status: att.status,
        }));

      if (toDelete.length > 0) {
        await Attendance.destroy({
          where: { date, memberId: { [Op.in]: toDelete } },
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
      return { message: "Attendance submitted successfully" };
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  static async getAllAttendance(leaderId: number, month: string, year: string) {
    const startDate = dayjs(`${year}-${month}-01`).startOf("month");
    const endDate = startDate.endOf("month");

    const leader = await User.findByPk(leaderId, {
      include: [{ model: Member, as: "members", attributes: ["id", "name"] }],
    });

    if (!leader) throw new NotFoundError("Leader not found");

    const members = (leader as any).members || [];
    if (members.length === 0) return { memberStats: [] };

    const memberIds = members.map((m: Member) => m.id);

    const attendanceCount = await Attendance.findAll({
      attributes: [
        "memberId",
        "status",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
      ],
      where: {
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

    const attendanceMap = new Map<number, { presentCount: number, absentCount: number }>();
    for (const record of (attendanceCount as any[])) {
      const memberId = record.memberId;
      const count = parseInt(record.count, 10);
      
      if (!attendanceMap.has(memberId)) {
        attendanceMap.set(memberId, { presentCount: 0, absentCount: 0 });
      }
      
      const stats = attendanceMap.get(memberId)!;
      if (record.status === 0) stats.presentCount = count;
      else if (record.status === 1) stats.absentCount = count;
    }

    const memberStats = members.map((member: Member) => {
      const stats = attendanceMap.get(member.id) || { presentCount: 0, absentCount: 0 };
      return { 
        memberId: member.id, 
        name: member.name, 
        presentCount: stats.presentCount, 
        absentCount: stats.absentCount 
      };
    });

    return { memberStats };
  }
}
