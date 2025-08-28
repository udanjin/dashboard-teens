import { Controller, Get, Middleware, Post } from "@overnightjs/core";
import { Response } from "express";
import User from "../models/User";
import Member from "../models/Member";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
import Attendance from "../models/Attendance";
import { Op, Sequelize } from "sequelize";
import sequelize from "../config/db";
import dayjs from "dayjs";
import { error } from "console";
@Controller("api/attendance")
export class AttendanceController {
  @Get("sheet")
  @Middleware(authMiddleware)
  private async getAttendanceSheet(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<any> {
    const leaderId = req.user?.userId;
    const { date } = req.query;

    if (!leaderId || !date || typeof date !== "string") {
      return res.status(400).json({ error: "Leader ID and date are required" });
    }

    try {
      const leader = await User.findByPk(leaderId, {
        include: [{ model: Member, as: "members", attributes: ["id", "name"] }],
      });

      if (!leader) return res.status(404).json({ error: "Leader not found" });

      const members = (leader as any).members || [];
      const memberIds = members.map((m: Member) => m.id);

      const existingAttendances = await Attendance.findAll({
        where: { memberId: { [Op.in]: memberIds }, leaderId, date },
      });

      const attendanceSheet = members.map((member: Member) => {
        const attendanceRecord = existingAttendances.find(
          (a) => a.memberId === member.id
        );
        return {
          memberId: member.id,
          name: member.name,
          status: attendanceRecord ? attendanceRecord.status : null,
        };
      });

      res.json(attendanceSheet);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch attendance sheet" });
    }
  }

  @Post("")
  @Middleware(authMiddleware)
  private async submitAttendance(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<any> {
    const leaderId = req.user?.userId;
    const { date, attendances } = req.body;

    if (!leaderId || !date || !Array.isArray(attendances)) {
      return res.status(400).json({ error: "Invalid payload" });
    }

    const transaction = await sequelize.transaction();

    try {
      // 1. Pisahkan data yang akan dihapus dan yang akan di-upsert
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

      // 2. Hapus data yang statusnya diubah menjadi null (unmarked)
      if (toDelete.length > 0) {
        await Attendance.destroy({
          where: {
            leaderId,
            date,
            memberId: { [Op.in]: toDelete },
          },
          transaction,
        });
      }

      // 3. Lakukan upsert untuk data yang statusnya present (0) atau absent (1)
      if (toUpsert.length > 0) {
        await Attendance.bulkCreate(toUpsert, {
          updateOnDuplicate: ["status"], // Perbarui status jika data sudah ada
          transaction,
        });
      }

      await transaction.commit();
      res.status(200).json({ message: "Attendance submitted successfully" });
    } catch (err) {
      await transaction.rollback();
      console.error(err);
      res.status(500).json({ error: "Failed to submit attendance" });
    }
  }

  @Get("single-attendance")
  @Middleware(authMiddleware)
  private async getAllAttendance(req: AuthenticatedRequest, res: Response) {
    const leaderId = req.user?.userId;
    const { month, year } = req.query;
    if (!leaderId || !month || !year) {
      return res
        .status(400)
        .json({ error: "Leader ID, month and year are required" });
    }
    try {
      const startDate = dayjs(`${year}-${month}-01`).startOf("month");
      const endDate = startDate.endOf("month");

      const leader = await User.findByPk(leaderId, {
        include: [{ model: Member, as: "members", attributes: ["id", "name"] }],
      });
      if (!leader) return res.status(404).json({ error: "Leader not found" });
      const members = (leader as any).members || [];
      if (members.length === 0) {
        return res.json({ memberStats: [] });
      }
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
        const recordsForMember = (attendanceCount as any[]).filter((p)=> p.memberId===member.id);
       
        recordsForMember.forEach(record=>{
            if(record.status === 0){
                presentCount = parseInt(record.count,10);
            }else if(record.status === 1){
                absentCount = parseInt(record.count,10);
            }
        })
        // console.log(absentCount);
        return {
          memberId: member.id,
          name: member.name,
          presentCount,
          absentCount,
        };
      });
      res.json({ memberStats });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to calculate attendance" });
    }
  }
}
