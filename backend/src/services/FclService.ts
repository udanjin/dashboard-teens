import { User, Member } from "../models";
import sequelize from "../config/db";
import { normalizePhoneNumber } from "../utils/phone.util";

export class FclService {
  /**
   * Bulk creates members and associates them with a leader efficiently.
   */
  static async addMembers(leaderId: number, membersData: any[]) {
    const transaction = await sequelize.transaction();
    try {
      const leader = await User.findByPk(leaderId, { transaction });
      if (!leader) {
        throw new Error("Leader not found");
      }

      // Check for existing members with the same name for this leader
      const existingMembers = await (leader as any).getMembers({
        where: {
          name: membersData.map(m => m.name),
        },
        transaction,
      });

      if (existingMembers.length > 0) {
        const existingNames = existingMembers.map((m: any) => m.name).join(", ");
        throw new Error(`Members already exist for this leader: ${existingNames}`);
      }

      const membersToCreate = membersData.map(memberInfo => {
        let validPhoneNumber = null;
        if (memberInfo.phoneNumber) {
          validPhoneNumber = normalizePhoneNumber(memberInfo.phoneNumber);
          if (!validPhoneNumber) {
            throw new Error(`Format Phone Number of ${memberInfo.name} is invalid`);
          }
        }
        return {
          name: memberInfo.name,
          grade: memberInfo.grade,
          gender: memberInfo.gender,
          dob: memberInfo.dob,
          phoneNumber: validPhoneNumber,
        };
      });

      // Bulk create to fix N+1
      const createdMembers = await Member.bulkCreate(membersToCreate, { transaction });
      
      // Bulk associate
      await (leader as any).addMembers(createdMembers, { transaction });

      await transaction.commit();
      return createdMembers;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async editMember(leaderId: number, memberId: number, data: { name?: string, dob?: string, phoneNumber?: string }) {
    const leader = await User.findByPk(leaderId, {
      include: [{ model: Member, as: "members", where: { id: memberId }, required: false }],
    });

    if (!leader) {
      throw new Error("Leader not found");
    }

    const members = (leader as any).members as Member[];
    if (!members || members.length === 0) {
      throw new Error("Member not found or does not belong to this leader");
    }

    const member = members[0];
    
    if (data.name) member.name = data.name;
    if (data.dob) member.dob = new Date(data.dob);
    if (data.phoneNumber) {
      const validPhoneNumber = normalizePhoneNumber(data.phoneNumber);
      if (!validPhoneNumber) {
        throw new Error("Format Phone Number is invalid");
      }
      member.phoneNumber = validPhoneNumber;
    }

    await member.save();
    return member;
  }
}
