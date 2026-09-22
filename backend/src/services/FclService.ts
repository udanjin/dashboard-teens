import { Op, Sequelize } from "sequelize";
import sequelize from "../config/db";
import { User, Member, Role, Attendance, FamilyCell } from "../models";
import { normalizePhoneNumber } from "../utils/phone.util";
import dayjs from "dayjs";
import { BadRequestError, NotFoundError, ForbiddenError, AppError } from "../errors/AppError";
import { addMembersSchema, editMemberSchema } from "../dtos/Fcl.dto";
import { z } from "zod";

export class FclService {
  static async addMembers(leaderId: number, membersData: z.infer<typeof addMembersSchema>["membersData"]) {
    const transaction = await sequelize.transaction();
    try {
      const leader = await User.findByPk(leaderId);
      if (!leader) {
        throw new NotFoundError("Leader not found");
      }
      if (!leader.fcId) {
        throw new ForbiddenError("You must be assigned to a Family Cell before adding members.");
      }

      for (const memberInfo of membersData) {
        const existing = await (leader as any).getMembers({
          where: { name: memberInfo.name },
          transaction,
        });

        if (existing.length > 0) {
          throw new AppError(`Member "${memberInfo.name}" already exists for this leader.`, 409);
        }

        let validPhoneNumber = null;
        if (memberInfo.phoneNumber) {
          validPhoneNumber = normalizePhoneNumber(memberInfo.phoneNumber);
          if (!validPhoneNumber) {
            throw new BadRequestError(`Format Phone Number of ${memberInfo.name} is invalid`);
          }
        }

        const newMember = await Member.create(
          { name: memberInfo.name, dob: memberInfo.dob, phoneNumber: validPhoneNumber },
          { transaction },
        );
        await (leader as any).addMember(newMember, { transaction });
      }

      await transaction.commit();
      return { message: `${membersData.length} members added successfully` };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async editMember(leaderId: number, memberId: number, data: z.infer<typeof editMemberSchema>) {
    if (!data.name && !data.dob && !data.phoneNumber) {
      throw new BadRequestError("At least one of name or date of birth or phone number is required");
    }

    const leader = await User.findByPk(leaderId, {
      include: [{ model: Member, as: "members", where: { id: memberId }, required: false }],
    });

    if (!leader) throw new NotFoundError("Leader not found");

    const ownedMembers = (leader as any).members ?? [];
    if (ownedMembers.length === 0) {
      throw new ForbiddenError("You do not have permission to edit this member");
    }

    const member = await Member.findByPk(memberId);
    if (!member) throw new NotFoundError("Member not found");

    if (data.name) member.name = data.name;
    if (data.dob) member.dob = data.dob as any;
    
    if (data.phoneNumber !== undefined) {
      if (data.phoneNumber) {
        const validPhoneNumber = normalizePhoneNumber(data.phoneNumber);
        if (!validPhoneNumber) throw new BadRequestError(`Format Phone Number of ${member.name} is invalid`);
        member.phoneNumber = validPhoneNumber;
      } else {
        member.phoneNumber = null as any;
      }
    }

    await member.save();
    return { id: member.id, name: member.name, dob: member.dob, phoneNumber: member.phoneNumber };
  }

  static async getMyMembers(leaderId: number) {
    const leader = await User.findByPk(leaderId, {
      include: [{ model: Member, as: "members" }],
    });

    if (!leader) throw new NotFoundError("Leader not found");
    return (leader as any).members || [];
  }

  static async getFclSummary(month?: string, year?: string) {
    const targetDate = month && year ? dayjs(`${year}-${month}-01`) : dayjs();
    const startDate = targetDate.startOf("month").format("YYYY-MM-DD");
    const endDate = targetDate.endOf("month").format("YYYY-MM-DD");

    const familyCells = await FamilyCell.findAll({
      attributes: ["id", "name", "grade"],
      include: [
        {
          model: User,
          as: "leaders",
          attributes: ["id", "username", "gender"],
          where: { status: "approved" },
          required: true,
        },
        {
          model: Member,
          as: "members",
          attributes: ["id", "name", "dob", "phoneNumber"],
        },
      ],
    });

    if (!familyCells.length) return [];

    const allMemberIds = familyCells.flatMap((fc: any) =>
      fc.members.map((m: Member) => m.id),
    );

    let attendanceCounts: any[] = [];
    if (allMemberIds.length > 0) {
      attendanceCounts = await Attendance.findAll({
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
    }

    return familyCells.map((fc: any) => {
      const membersWithStats = fc.members.map((member: Member) => {
        const presentRecord = attendanceCounts.find(
          (p) => p.memberId === member.id && p.status === 0,
        );
        const absentRecord = attendanceCounts.find(
          (p) => p.memberId === member.id && p.status === 1,
        );
        return {
          ...member.get({ plain: true }),
          presentCount: presentRecord ? parseInt(presentRecord.count, 10) : 0,
          absentCount: absentRecord ? parseInt(absentRecord.count, 10) : 0,
        };
      });

      return {
        fcId: fc.id,
        fcName: fc.name,
        grade: fc.grade,
        gender: fc.leaders[0]?.gender,
        leaders: fc.leaders.map((l: any) => ({ id: l.id, name: l.username })),
        members: membersWithStats,
      };
    });
  }

  static async getFclWeeklyStats(filters: { month?: string; year?: string; gender?: string; grade?: string; lastWeeks?: string }) {
    const { month, year, gender, grade, lastWeeks } = filters;

    const fcWhere: any = {};
    if (grade) fcWhere.grade = parseInt(grade, 10);

    const userWhere: any = { status: "approved" };
    if (gender) userWhere.gender = gender;

    const familyCells = await FamilyCell.findAll({
      where: Object.keys(fcWhere).length > 0 ? fcWhere : undefined,
      include: [
        {
          model: User,
          as: "leaders",
          where: userWhere,
          required: true,
        },
        {
          model: Member,
          as: "members",
          attributes: ["id"],
          required: false,
        },
      ],
    });

    const memberIds = familyCells.flatMap((fc: any) =>
      fc.members.map((m: Member) => m.id),
    );

    let emptySundays: dayjs.Dayjs[] = [];
    if (lastWeeks) {
      const n = parseInt(lastWeeks, 10);
      let current = dayjs();
      if (current.day() !== 0) {
        current = current.day(0); // Go to previous Sunday
      }
      for (let i = n - 1; i >= 0; i--) {
        emptySundays.push(current.subtract(i * 7, "day"));
      }
    } else {
      const targetDate = month && year ? dayjs(`${year}-${month}-01`) : dayjs();
      emptySundays = FclService.getSundaysOfMonth(targetDate);
    }

    const labels = emptySundays.map((d, i) => lastWeeks ? d.format("MMM D") : `Week ${i + 1}`);

    if (memberIds.length === 0) {
      return {
        labels,
        data: emptySundays.map(() => 0),
      };
    }

    const sundays = emptySundays.map((d) => d.format("YYYY-MM-DD"));

    const weeklyCounts = await Attendance.findAll({
      attributes: [
        "date",
        [Sequelize.fn("COUNT", Sequelize.col("id")), "presentCount"],
      ],
      where: {
        status: 0,
        memberId: { [Op.in]: memberIds },
        date: { [Op.in]: sundays },
      },
      group: ["date"],
      raw: true,
    });

    const data = sundays.map((sundayDate) => {
      const record = (weeklyCounts as any[]).find((c) =>
        dayjs(c.date).isSame(sundayDate, "day"),
      );
      return record ? parseInt(record.presentCount, 10) : 0;
    });

    return { labels, data, dates: sundays };
  }

  private static getSundaysOfMonth(date: dayjs.Dayjs) {
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

  static async getLeaderSubmissionStatus() {
    // Find the most recent Sunday on or before today
    let targetSunday = dayjs();
    if (targetSunday.day() !== 0) {
      targetSunday = targetSunday.subtract(targetSunday.day(), "day");
    }
    const targetDate = targetSunday.format("YYYY-MM-DD");

    // Get all leaders with their members
    const leaders = await User.findAll({
      attributes: ["id", "username"],
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
          attributes: ["id"],
          required: false,
        }
      ],
    });

    const totalLeaders = leaders.length;
    if (totalLeaders === 0) {
      return { submitted: 0, total: 0, date: targetDate, unsubmitted: [] };
    }

    // Collect all member IDs across all leaders
    const allMemberIds = leaders.flatMap((l: any) => 
      (l.members || []).map((m: any) => m.id)
    );

    // Find which of these members have attendance records on this date
    let submittedMemberIds: number[] = [];
    if (allMemberIds.length > 0) {
      const submittedAttendances = await Attendance.findAll({
        attributes: ["memberId"],
        where: {
          date: targetDate,
          memberId: { [Op.in]: allMemberIds }
        },
        raw: true,
      });
      submittedMemberIds = submittedAttendances.map(a => a.memberId);
    }

    // A leader's cell is submitted if ANY of their members have an attendance record
    const unsubmittedLeaders: string[] = [];
    let submittedCount = 0;

    for (const leader of leaders) {
      const leaderMembers = (leader as any).members || [];
      const leaderMemberIds = leaderMembers.map((m: any) => m.id);
      
      const hasSubmitted = leaderMemberIds.some((id: number) => submittedMemberIds.includes(id));
      
      if (hasSubmitted) {
        submittedCount++;
      } else {
        unsubmittedLeaders.push(leader.username);
      }
    }

    return {
      submitted: submittedCount,
      total: totalLeaders,
      date: targetDate,
      unsubmitted: unsubmittedLeaders,
    };
  }

  static async requestDeleteMember(memberId: number, reason: string) {
    const member = await Member.findByPk(memberId);
    if (!member) throw new NotFoundError("Member not found");

    member.status = "pending_deletion";
    member.deletionReason = reason;
    await member.save();
    return member;
  }

  static async getDeletionRequests() {
    const pendingMembers = await Member.findAll({
      where: { status: "pending_deletion" },
      attributes: ["id", "name", "dob", "deletionReason"],
      include: [
        {
          model: require("../models/FamilyCell").default,
          as: "familyCell",
          attributes: ["name", "grade"],
          include: [
            {
              model: User,
              as: "leaders",
              attributes: ["username", "gender"],
            }
          ]
        },
      ],
    });

    return pendingMembers.map((member) => {
      const fc = member.familyCell as any;
      const leader = fc?.leaders?.[0] ?? null;
      return {
        id: member.id,
        name: member.name,
        dob: member.dob,
        deletionReason: member.deletionReason,
        grade: fc?.grade ?? null,
        gender: leader?.gender ?? null,
        leaderName: leader?.username ?? "N/A",
      };
    });
  }

  static async approveDeleteMember(memberId: number) {
    const transaction = await sequelize.transaction();
    try {
      const member = await Member.findByPk(memberId, { transaction });
      if (!member) {
        throw new NotFoundError("Member not found");
      }

      await Attendance.destroy({ where: { memberId }, transaction });
      await member.destroy({ transaction });
      await transaction.commit();
    } catch (err) {
      await transaction.rollback();
      throw err;
    }
  }

  static async rejectDeletion(memberId: number) {
    const member = await Member.findByPk(memberId);
    if (!member) throw new NotFoundError("Member not found");

    member.status = "active";
    member.deletionReason = null;
    await member.save();
  }

  static async getBirthdays(fcId: number | null) {
    let query = `
      SELECT dob AS "date", COALESCE(name, username) AS "name", 'User' AS "type" FROM users WHERE dob IS NOT NULL
    `;
    const replacements: any = {};
    if (fcId) {
      query += `
        UNION ALL
        SELECT dob AS "date", name, 'Member' AS "type" FROM members WHERE dob IS NOT NULL AND "fcId" = :fcId
      `;
      replacements.fcId = fcId;
    }
    
    return await sequelize.query(query, { type: "SELECT", replacements });
  }
}
