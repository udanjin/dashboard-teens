import { Op, Sequelize } from "sequelize";
import sequelize from "../config/db";
import { User, Member, Role, Attendance } from "../models";
import { normalizePhoneNumber } from "../utils/phone.util";
import dayjs from "dayjs";
import { BadRequestError, NotFoundError, ForbiddenError, AppError } from "../errors/AppError";

export class FclService {
  static async addMembers(leaderId: number, membersData: any[]) {
    const transaction = await sequelize.transaction();
    try {
      const leader = await User.findByPk(leaderId);
      if (!leader) {
        throw new NotFoundError("Leader not found");
      }

      for (const memberInfo of membersData) {
        const existing = await (leader as any).getMembers({
          where: { name: memberInfo.name },
          transaction,
        });

        if (existing.length > 0) {
          throw new AppError(`Member "${memberInfo.name}" already exists for this leader.`, 409);
        }

        const gradeNum = parseInt(memberInfo.grade, 10);
        if (isNaN(gradeNum)) {
          throw new BadRequestError(`Grade must be a valid number for member: ${memberInfo.name}`);
        }
        
        let validPhoneNumber = null;
        if (memberInfo.phoneNumber) {
          validPhoneNumber = normalizePhoneNumber(memberInfo.phoneNumber);
        }
        if (memberInfo.phoneNumber && !validPhoneNumber) {
          throw new BadRequestError(`Format Phone Number of ${memberInfo.name} is invalid`);
        }

        const newMember = await Member.create(
          { name: memberInfo.name, grade: gradeNum, gender: memberInfo.gender, dob: memberInfo.dob, phoneNumber: validPhoneNumber },
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

  static async editMember(leaderId: number, memberId: number, data: any) {
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
    if (data.dob) member.dob = data.dob;
    
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
      include: [{ model: Member, as: "members", through: { attributes: [] } }],
    });

    if (!leader) throw new NotFoundError("Leader not found");
    return (leader as any).members || [];
  }

  static async getFclSummary(month?: string, year?: string) {
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
          attributes: ["id", "name", "dob", "phoneNumber"],
          through: { attributes: [] },
        },
      ],
    });

    if (!leaders.length) return [];

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

    return leaders.map((leader: any) => {
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
  }

  static async getFclWeeklyStats(filters: { month?: string; year?: string; gender?: string; grade?: string; lastWeeks?: string }) {
    const { month, year, gender, grade, lastWeeks } = filters;

    const memberWhere: any = {};
    if (gender) memberWhere.gender = gender;
    if (grade) memberWhere.grade = parseInt(grade, 10);

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
        leaderId: { [Op.in]: leaderIds },
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

    // Get all leaders
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
      ],
    });

    const totalLeaders = leaders.length;
    const leaderIds = leaders.map((l) => l.id);

    if (leaderIds.length === 0) {
      return { submitted: 0, total: 0, date: targetDate, unsubmitted: [] };
    }

    // Count distinct leaders who have at least 1 attendance record for this date
    const submittedLeaders = await Attendance.findAll({
      attributes: [
        [Sequelize.fn("DISTINCT", Sequelize.col("leaderId")), "leaderId"],
      ],
      where: {
        leaderId: { [Op.in]: leaderIds },
        date: targetDate,
      },
      raw: true,
    });

    const submittedLeaderIds = submittedLeaders.map((s: any) => s.leaderId);
    const unsubmittedLeaders = leaders
      .filter((l) => !submittedLeaderIds.includes(l.id))
      .map((l) => l.username);

    return {
      submitted: submittedLeaders.length,
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
          model: User,
          as: "leaders",
          attributes: ["username", "grade", "gender"],
          through: { attributes: [] },
        },
      ],
    });

    return pendingMembers.map((member) => {
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

  static async getBirthdays() {
    const query = `
      SELECT dob AS "date", username AS "name", 'User' AS "type" FROM users WHERE dob IS NOT NULL
      UNION ALL
      SELECT dob AS "date", name, 'Member' AS "type" FROM members WHERE dob IS NOT NULL;
    `;
    return await sequelize.query(query, { type: "SELECT" });
  }
}
