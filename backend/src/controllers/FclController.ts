import {
  Controller,
  Delete,
  Get,
  Middleware,
  Post,
  Put,
} from "@overnightjs/core";
import { Request, Response } from "express";
import User from "../models/User";
import Member from "../models/Member";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";

import Attendance from "../models/Attendance";

import sequelize from "../config/db";
import { roleAuthMiddleware } from "../middleware/roleAuth";
import { Op, Sequelize } from "sequelize";
import dayjs from "dayjs";

@Controller("api/fcl")
export class FclController {
  @Post("members")
  @Middleware(authMiddleware)
  private async addMembers(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<any> {
    const { membersData } = req.body;
    const leaderId = req.user?.userId;

    if (!Array.isArray(membersData) || membersData.length == 0) {
      return res.status(400).json({ error: "You must insert member Data" });
    }
    if (!leaderId) {
      return res.status(400).json({ error: "Unathourized" });
    }
    try {
      const leader = await User.findByPk(leaderId);
      if (!leader) {
        return res.status(404).json({ error: "leader not found" });
      }
      const memberInstances = await Promise.all(
        membersData.map((memberInfo) => {
          if (!memberInfo.name || !memberInfo.grade || !memberInfo.gender) {
            throw new Error(
              `Invalid data for member: ${JSON.stringify(memberInfo)}`
            );
          }
          const gradeAsNumber = parseInt(memberInfo.grade, 10);
          if (isNaN(gradeAsNumber)) {
            throw new Error(
              `'grade' must be a valid number for member: ${memberInfo.name}`
            );
          }
          return Member.findOrCreate({
            where: {
              name: memberInfo.name,
              grade: gradeAsNumber,
              gender: memberInfo.gender,
            },
          });
        })
      );
      const members = memberInstances.map(([member]) => member);
      await (leader as any).addMembers(members);
      res
        .status(201)
        .json({ message: `${members.length} members added succesfully` });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Failed to add members" });
    }
  }

  @Get("my-members")
  @Middleware(authMiddleware)
  private async getMyMembers(req: AuthenticatedRequest, res: Response) {
    const leaderId = req.user!.userId;
    if (!leaderId) {
      return res.status(400).json({ error: "Unathourized" });
    }
    try {
      const leader = await User.findByPk(leaderId, {
        include: [
          {
            model: Member,
            as: "members",
            through: { attributes: [] },
          },
        ],
      });
      if (!leader) {
        return res.status(404).json({ error: "leader not found" });
      }
      res.json((leader as any).members || []);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Failed to fetch Members" });
    }
  }

  @Get("fcl-summary")
  @Middleware([authMiddleware, roleAuthMiddleware(["admin", "fcl"])])
  private async getFclSummary(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<any> {
    try {
      const { month, year } = req.query;
      const targetDate = month && year ? dayjs(`${year}-${month}-01`) : dayjs();
      const startDate = targetDate.startOf("month").format("YYYY-MM-DD");
      const endDate = targetDate.endOf("month").format("YYYY-MM-DD");

      const leaders = await User.findAll({
        where: { role: { [Op.in]: ["fcl", "leader", "admin"] } },
        attributes: ["id", "username"],
        include: [
          {
            model: Member,
            as: "members",
            attributes: ["id", "name", "grade", "gender"],
            through: { attributes: [] },
          },
        ],
      });

      if (!leaders || leaders.length === 0) {
        return res.json([]);
      }

      const allMemberIds = leaders.flatMap((leader: any) =>
        leader.members.map((m: Member) => m.id)
      );

      const attendanceCounts = await Attendance.findAll({
        attributes: [
          "memberId",
          "status",
          [Sequelize.fn("COUNT", Sequelize.col("id")), "count"],
        ],
        where: {
          memberId: { [Op.in]: allMemberIds },
          status: { [Op.in]: [0, 1] },
          date: { [Op.between]: [startDate, endDate] },
        },
        group: ["memberId", "status"],
        raw: true,
      });

      const summaryData = leaders.map((leader: any) => {
        const membersWithStats = leader.members.map((member: Member) => {
          const presentRecord = (attendanceCounts as any[]).find(
            (p) => p.memberId === member.id && p.status === 0
          );
          const absentRecord = (attendanceCounts as any[]).find(
            (p) => p.memberId === member.id && p.status === 1
          );
          return {
            ...member.get({ plain: true }),
            presentCount: presentRecord ? parseInt(presentRecord.count, 10) : 0,
            absentCount: absentRecord ? parseInt(absentRecord.count, 10) : 0,
          };
        });
        return {
          leaderId: leader.id,
          leaderName: leader.username,
          members: membersWithStats,
        };
      });

      res.json(summaryData);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch FCL summary" });
    }
  }
  @Put("request-delete/:id")
  @Middleware(authMiddleware)
  private async requestDeleteMember(req: AuthenticatedRequest, res: Response) {
    const { reason } = req.body;
    const { id } = req.params;
    if (!reason || typeof reason !== "string" || reason.trim() === "") {
      return res
        .status(400)
        .json({ error: "A reason for deletion is required" });
    }
    try {
      const member = await Member.findByPk(id);
      if (!member) {
        return res.status(404).json({ error: "member not found" });
      }
      member.status = "pending_deletion";
      member.deletionReason = reason;
      await member.save();
      return res.status(200).json({
        message: "equest to delete member has been submitted for approval.",
      });
    } catch (err) {
      console.log(err);
      return res.status(400).json({ error: "failed to delete member" });
    }
  }

  @Get("weekly-stats")
  @Middleware([authMiddleware, roleAuthMiddleware(["admin", "fcl", "leader"])])
  private async getFclWeeklyStats(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<any> {
    try {
      const { month, year, gender, grade, leaderName } = req.query;
      const targetDate = month && year ? dayjs(`${year}-${month}-01`) : dayjs();
      const startDate = targetDate.startOf("month");
      const endDate = targetDate.endOf("month");

      const memberWhere: any = {};
      if (gender) memberWhere.gender = gender as string;
      if (grade) memberWhere.grade = parseInt(grade as string, 10);

      const leaderWhere: any = { role: { [Op.in]: ["fcl", "leader",'admin'] } };
      if (leaderName) leaderWhere.username = leaderName as string;

      const leaders = await User.findAll({
        where: leaderWhere,
        include: [
          {
            model: Member,
            as: "members",
            where: memberWhere,
            attributes: ["id"],
            required: false,
          },
        ],
      });

      // Kumpulkan ID leader dan member yang relevan
      const leaderIds = leaders.map((l) => l.id);
      const memberIds = leaders.flatMap((leader: any) =>
        leader.members.map((m: Member) => m.id)
      );

      if (memberIds.length === 0) {
        const emptySundays = this.getSundaysOfMonth(targetDate);
        return res.json({
          labels: emptySundays.map((_, i) => `Week ${i + 1}`),
          data: emptySundays.map(() => 0),
        });
      }

      const sundays = this.getSundaysOfMonth(targetDate).map((d) =>
        d.format("YYYY-MM-DD")
      );

      // FIX: Menambahkan filter 'leaderId' ke dalam query absensi
      const weeklyCounts = await Attendance.findAll({
        attributes: [
          "date",
          [Sequelize.fn("COUNT", Sequelize.col("id")), "presentCount"],
        ],
        where: {
          status: 0,
          memberId: { [Op.in]: memberIds },
          leaderId: { [Op.in]: leaderIds }, // <-- Perbaikan ada di sini
          date: { [Op.in]: sundays },
        },
        group: ["date"],
        raw: true,
      });

      const labels = sundays.map((_, index) => `Week ${index + 1}`);
      const data = sundays.map((sundayDate) => {
        const record = (weeklyCounts as any[]).find((c) =>
          dayjs(c.date).isSame(sundayDate, "day")
        );
        return record ? parseInt(record.presentCount, 10) : 0;
      });

      res.json({ labels, data });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch weekly stats" });
    }
  }
  private getSundaysOfMonth(date: dayjs.Dayjs) {
    const sundays = [];
    const start = date.startOf("month");
    let currentSunday = start.day(7);
    if (currentSunday.date() > 7) {
      currentSunday = currentSunday.subtract(7, "day");
    }
    while (currentSunday.month() === start.month()) {
      sundays.push(currentSunday);
      currentSunday = currentSunday.add(7, "day");
    }
    return sundays;
  }
  @Get("deletion-request")
  @Middleware([authMiddleware, roleAuthMiddleware(["admin", "fcl"])])
  private async getDeletionRequest(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<any> {
    try {
      const req = await Member.findAll({
        where: {
          status: "pending_deletion",
        },
        attributes: ["id", "name", "grade", "gender", "deletionReason"],
      });
      res.json(req);
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Failed to fetch deletion request" });
    }
  }

  @Delete("approve-deletion/:id")
  @Middleware([authMiddleware, roleAuthMiddleware(["admin", "fcl"])])
  private async approveDeleteMember(req: AuthenticatedRequest, res: Response) {
    const { id } = req.params;
    const transaction = await sequelize.transaction();
    try {
      const member = await Member.findByPk(id, { transaction });
      if (!member) {
        await transaction.rollback();
        return res
          .status(404)
          .json({ error: "Member not found or already processed" });
      }
      await Attendance.destroy({ where: { memberId: id }, transaction });
      await member.destroy({ transaction });
      await transaction.commit();
      return res
        .status(200)
        .json({ message: "Member deletion approved and completed." });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to approve deletion" });
    }
  }
  @Put("reject-deletion/:id")
  @Middleware([authMiddleware, roleAuthMiddleware(["admin", "fcl"])])
  private async rejectDeletion(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<any> {
    const { id } = req.params;
    try {
      const member = await Member.findByPk(id);
      if (!member) {
        return res
          .status(404)
          .json({ error: "Member not found or already processed" });
      }

      member.status = "active";
      member.deletionReason = null;
      await member.save();

      return res
        .status(200)
        .json({ message: "Member deletion request has been rejected." });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: "Failed to reject deletion" });
    }
  }
}
