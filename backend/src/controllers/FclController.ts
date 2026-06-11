import { Controller, Delete, Get, Middleware, Post, Put } from "@overnightjs/core";
import { Request, Response } from "express";
import { User, Member, Role, Attendance, PERMISSIONS } from "../models";
import { authMiddleware } from "../middleware/auth";
import { requirePermission } from "../middleware/roleAuth";
import sequelize from "../config/db";
import { Op, Sequelize } from "sequelize";
import dayjs from "dayjs";
import type { AuthenticatedRequest } from "../types";

@Controller("api/fcl")
export class FclController {
  @Post("members")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.FCL_MANAGE_MEMBERS)])
  private async addMembers(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { membersData } = req.body;
    const leaderId = req.user?.userId;

    if (!Array.isArray(membersData) || membersData.length === 0) {
      return res.status(400).json({ error: "Member data is required" });
    }
    if (!leaderId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const transaction = await sequelize.transaction();
    try {
      const leader = await User.findByPk(leaderId);
      if (!leader) {
        await transaction.rollback();
        return res.status(404).json({ error: "Leader not found" });
      }

      for (const memberInfo of membersData) {
        if (!memberInfo.name || !memberInfo.grade || !memberInfo.gender || !memberInfo.dob) {
          throw new Error(`Invalid data for member: ${JSON.stringify(memberInfo)}`);
        }

        const existing = await (leader as any).getMembers({
          where: { name: memberInfo.name },
          transaction,
        });

        if (existing.length > 0) {
          await transaction.rollback();
          return res.status(409).json({
            error: `Member "${memberInfo.name}" already exists for this leader.`,
          });
        }

        const gradeNum = parseInt(memberInfo.grade, 10);
        if (isNaN(gradeNum)) {
          throw new Error(`Grade must be a valid number for member: ${memberInfo.name}`);
        }

        const newMember = await Member.create(
          { name: memberInfo.name, grade: gradeNum, gender: memberInfo.gender, dob: memberInfo.dob },
          { transaction },
        );
        await (leader as any).addMember(newMember, { transaction });
      }

      await transaction.commit();
      res.status(201).json({ message: `${membersData.length} members added successfully` });
    } catch (error: any) {
      await transaction.rollback();
      console.error("Add members error:", error);
      res.status(500).json({ error: error.message || "Failed to add members" });
    }
  }

  @Get("my-members")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.FCL_VIEW)])
  private async getMyMembers(req: AuthenticatedRequest, res: Response): Promise<any> {
    const leaderId = req.user!.userId;

    try {
      const leader = await User.findByPk(leaderId, {
        include: [{ model: Member, as: "members", through: { attributes: [] } }],
      });

      if (!leader) {
        return res.status(404).json({ error: "Leader not found" });
      }

      res.json((leader as any).members || []);
    } catch (err) {
      console.error("Fetch members error:", err);
      res.status(500).json({ error: "Failed to fetch members" });
    }
  }

  @Get("fcl-summary")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.FCL_VIEW_SUMMARY)])
  private async getFclSummary(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { month, year } = req.query;
      const targetDate = month && year ? dayjs(`${year}-${month}-01`) : dayjs();
      const startDate = targetDate.startOf("month").format("YYYY-MM-DD");
      const endDate = targetDate.endOf("month").format("YYYY-MM-DD");

      const leaders = await User.findAll({
        attributes: ["id", "username", "grade", "gender"],
        include: [
          {
            model: Role,
            as: "roles",
            where: { name: { [Op.in]: ["leader"] } },
            attributes: [],
            through: { attributes: [] },
          },
          {
            model: Member,
            as: "members",
            attributes: ["id", "name", "dob"],
            through: { attributes: [] },
          },
        ],
      });

      if (!leaders.length) return res.json([]);

      const allMemberIds = leaders.flatMap((l: any) =>
        l.members.map((m: Member) => m.id),
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
            (p) => p.memberId === member.id && p.status === 0,
          );
          const absentRecord = (attendanceCounts as any[]).find(
            (p) => p.memberId === member.id && p.status === 1,
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
          grade: leader.grade,
          gender: leader.gender,
          members: membersWithStats,
        };
      });

      res.json(summaryData);
    } catch (err) {
      console.error("FCL summary error:", err);
      res.status(500).json({ error: "Failed to fetch FCL summary" });
    }
  }

  @Get("weekly-stats")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.FCL_VIEW)])
  private async getFclWeeklyStats(req: AuthenticatedRequest, res: Response): Promise<any> {
    try {
      const { month, year, gender, grade } = req.query;
      const targetDate = month && year ? dayjs(`${year}-${month}-01`) : dayjs();

      const memberWhere: any = {};
      if (gender) memberWhere.gender = gender as string;
      if (grade) memberWhere.grade = parseInt(grade as string, 10);

      const leaders = await User.findAll({
        include: [
          {
            model: Role,
            as: "roles",
            where: { name: { [Op.in]: ["leader"] } },
            attributes: [],
            through: { attributes: [] },
          },
          {
            model: Member,
            as: "members",
            where: memberWhere,
            attributes: ["id"],
            required: false,
          },
        ],
      });

      const leaderIds = leaders.map((l) => l.id);
      const memberIds = leaders.flatMap((l: any) =>
        l.members.map((m: Member) => m.id),
      );

      if (memberIds.length === 0) {
        const emptySundays = this.getSundaysOfMonth(targetDate);
        return res.json({
          labels: emptySundays.map((_, i) => `Week ${i + 1}`),
          data: emptySundays.map(() => 0),
        });
      }

      const sundays = this.getSundaysOfMonth(targetDate).map((d) =>
        d.format("YYYY-MM-DD"),
      );

      const weeklyCounts = await Attendance.findAll({
        attributes: [
          "date",
          [Sequelize.fn("COUNT", Sequelize.col("id")), "presentCount"],
        ],
        where: {
          status: 0,
          memberId: { [Op.in]: memberIds },
          leaderId: { [Op.in]: leaderIds },
          date: { [Op.in]: sundays },
        },
        group: ["date"],
        raw: true,
      });

      const labels = sundays.map((_, i) => `Week ${i + 1}`);
      const data = sundays.map((sundayDate) => {
        const record = (weeklyCounts as any[]).find((c) =>
          dayjs(c.date).isSame(sundayDate, "day"),
        );
        return record ? parseInt(record.presentCount, 10) : 0;
      });

      res.json({ labels, data });
    } catch (err) {
      console.error("Weekly stats error:", err);
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

  @Put("request-delete/:id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.FCL_MANAGE_MEMBERS)])
  private async requestDeleteMember(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { reason } = req.body;
    const { id } = req.params;

    if (!reason || typeof reason !== "string" || reason.trim() === "") {
      return res.status(400).json({ error: "A reason for deletion is required" });
    }

    try {
      const member = await Member.findByPk(id);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      member.status = "pending_deletion";
      member.deletionReason = reason;
      await member.save();

      res.json({ message: "Deletion request submitted for approval." });
    } catch (err) {
      console.error("Request delete error:", err);
      res.status(500).json({ error: "Failed to submit deletion request" });
    }
  }

  @Get("deletion-request")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.FCL_MANAGE_DELETIONS)])
  private async getDeletionRequest(_req: AuthenticatedRequest, res: Response) {
    try {
      const pendingMembers = await Member.findAll({
        where: { status: "pending_deletion" },
        attributes: ["id", "name", "dob", "deletionReason"],
        include: [
          {
            model: User,
            as: "leaders",
            attributes: ["username", "grade", "gender"],
            through: { attributes: [] },
          },
        ],
      });

      const responseData = pendingMembers.map((member) => {
        const leader = member.leaders?.[0] ?? null;
        return {
          id: member.id,
          name: member.name,
          dob: member.dob,
          deletionReason: member.deletionReason,
          grade: leader?.grade ?? null,
          gender: leader?.gender ?? null,
          leaderName: leader?.username ?? "N/A",
        };
      });

      res.json(responseData);
    } catch (err) {
      console.error("Fetch deletion requests error:", err);
      res.status(500).json({ error: "Failed to fetch deletion requests" });
    }
  }

  @Delete("approve-deletion/:id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.FCL_MANAGE_DELETIONS)])
  private async approveDeleteMember(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;
    const transaction = await sequelize.transaction();

    try {
      const member = await Member.findByPk(id, { transaction });
      if (!member) {
        await transaction.rollback();
        return res.status(404).json({ error: "Member not found" });
      }

      await Attendance.destroy({ where: { memberId: id }, transaction });
      await member.destroy({ transaction });
      await transaction.commit();

      res.json({ message: "Member deletion approved and completed." });
    } catch (err) {
      await transaction.rollback();
      console.error("Approve deletion error:", err);
      res.status(500).json({ error: "Failed to approve deletion" });
    }
  }

  @Put("reject-deletion/:id")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.FCL_MANAGE_DELETIONS)])
  private async rejectDeletion(req: AuthenticatedRequest, res: Response): Promise<any> {
    const { id } = req.params;

    try {
      const member = await Member.findByPk(id);
      if (!member) {
        return res.status(404).json({ error: "Member not found" });
      }

      member.status = "active";
      member.deletionReason = null;
      await member.save();

      res.json({ message: "Deletion request has been rejected." });
    } catch (err) {
      console.error("Reject deletion error:", err);
      res.status(500).json({ error: "Failed to reject deletion" });
    }
  }

  @Get("birthdays")
  @Middleware([authMiddleware, requirePermission(PERMISSIONS.DASHBOARD_VIEW)])
  public async getBirthday(_req: AuthenticatedRequest, res: Response) {
    try {
      const query = `
        SELECT dob AS "date", username AS "name", 'User' AS "type" FROM users WHERE dob IS NOT NULL
        UNION ALL
        SELECT dob AS "date", name, 'Member' AS "type" FROM members WHERE dob IS NOT NULL;
      `;

      const birthdays = await sequelize.query(query, { type: "SELECT" });
      res.json(birthdays);
    } catch (err) {
      console.error("Fetch birthdays error:", err);
      res.status(500).json({ error: "Failed to fetch birthdays" });
    }
  }
}
