import {
  Controller,
  Delete,
  Get,
  Middleware,
  Post,
  Put,
} from "@overnightjs/core";
import { Request, Response } from "express";
import { User, Member, Role, Attendance } from "../models";
import { authMiddleware, AuthenticatedRequest } from "../middleware/auth";
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
    const transaction = await sequelize.transaction();
    try {
      const leader = await User.findByPk(leaderId);
      if (!leader) {
        await transaction.rollback();
        return res.status(404).json({ error: "Leader not Found" });
      }
      for (const memberInfo of membersData) {
        if (
          !memberInfo.name ||
          !memberInfo.grade ||
          !memberInfo.gender ||
          !memberInfo.dob
        ) {
          throw new Error(
            `Invalid data for member: ${JSON.stringify(memberInfo)}`
          );
        }
        const existingMember = await (leader as any).getMembers({
          where: { name: memberInfo.name },
          transaction,
        });
        if (existingMember.length > 0) {
          await transaction.rollback();
          return res.status(404).json({
            error: `Member with name "${memberInfo.name}" already exist for this leader.`,
          });
        }
        const gradeAsNumber = parseInt(memberInfo.grade, 10);
        if (isNaN(gradeAsNumber)) {
          throw new Error(
            `'grade' must be a valid number for member: ${memberInfo.name}`
          );
        }
        const newMember = await Member.create(
          {
            name: memberInfo.name,
            grade: gradeAsNumber,
            gender: memberInfo.gender,
            dob: memberInfo.dob,
          },
          { transaction }
        );
        await (leader as any).addMember(newMember, { transaction });
      }
      await transaction.commit();
      res
        .status(201)
        .json({ message: `${membersData.length} members added succcesfully` });
    } catch (error: any) {
      await transaction.rollback();
      console.error("Failed to add members", error);
      const errorMessage = error.message || "Failed to add members";
      res.status(500).json({ error: errorMessage });
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
        attributes: ["id", "username", "grade", "gender"],
        include: [
          {
            model: Role,
            as: "roles",
            where: {
              name: { [Op.in]: ["fcl", "leader"] },
            },
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
          grade: leader.grade,
          gender: leader.gender,
          members: membersWithStats,
        };
      });

      res.json(summaryData);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch FCL summary" });
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
      const memberWhere: any = {};
      if (gender) memberWhere.gender = gender as string;
      if (grade) memberWhere.grade = parseInt(grade as string, 10);

      const leaders = await User.findAll({
        include: [
          {
            // 1. Include the Role model to filter by role name
            model: Role,
            as: "roles",
            where: {
              name: { [Op.in]: ["fcl", "leader"] },
            },
            attributes: [], // We don't need role data in the result
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

  @Get("deletion-request")
  @Middleware([authMiddleware, roleAuthMiddleware(["admin", "fcl"])])
  private async getDeletionRequest(
    req: AuthenticatedRequest,
    res: Response
  ): Promise<any> {
    try {
      const pendingMembers = await Member.findAll({
        where: {
          status: "pending_deletion",
        },
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

      // Transform data for a clean, flat response structure for the frontend
      const responseData = pendingMembers.map((member) => {
        const leaderInfo =
          member.leaders && member.leaders.length > 0
            ? member.leaders[0]
            : null;

        return {
          id: member.id,
          name: member.name,
          dob: member.dob,
          deletionReason: member.deletionReason,
          grade: leaderInfo ? leaderInfo.grade : null,
          gender: leaderInfo ? leaderInfo.gender : null,
          leaderName: leaderInfo ? leaderInfo.username : "N/A",
        };
      });

      res.json(responseData);
    } catch (err) {
      console.error("Failed to fetch deletion requests:", err);
      res.status(500).json({ error: "Failed to fetch deletion requests" });
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

  @Get("birthdays")
  public async getBirthday(req: Request, res: Response) {
    try {
      // Query ini menggabungkan data dari dua tabel:
      // 1. Mengambil 'dob' dan 'username' dari tabel 'users'.
      // 2. Mengambil 'dob' dan 'name' dari tabel 'members'.
      // 'UNION ALL' digunakan untuk menggabungkan hasil dari kedua query tersebut.
      // Tipe 'User' atau 'Member' ditambahkan untuk membedakan asal data di frontend jika diperlukan.

      const query = `
        SELECT 
          dob AS "date", 
          username AS "name", 
          'User' AS "type" 
        FROM 
          users 
        WHERE 
          dob IS NOT NULL
        UNION ALL
        SELECT 
          dob AS "date", 
          name, 
          'Member' AS "type" 
        FROM 
          members 
        WHERE 
          dob IS NOT NULL;
      `;

      // Menjalankan raw query menggunakan Sequelize
      const birthdays = await sequelize.query(query, {
        type: "SELECT", // Menentukan tipe query sebagai SELECT
      });

      // Mengirimkan data sebagai respons
      return res.status(200).json(birthdays);
    } catch (error) {
      console.error("Error fetching birthdays:", error);
      return res
        .status(500)
        .json({ error: "An internal server error occurred" });
    }
  }
}
