import User from "./User";
import Member from "./Member";
import Role from "./Role";
import Attendance from "./Attendance";
import SportReport from "./SportReport";
import CashAdjustment from "./CashAdjustment";

SportReport.belongsTo(User, { as: "creator", foreignKey: "createdById" });
CashAdjustment.belongsTo(User, { as: "creator", foreignKey: "createdById" });

User.belongsToMany(Member, {
  through: "LeaderMember",
  as: "members",
  foreignKey: "leaderId",
});

Member.belongsToMany(User, {
  through: "LeaderMember",
  as: "leaders",
  foreignKey: "memberId",
});

User.belongsToMany(Role, {
  through: "UserRole",
  as: "roles",
  foreignKey: "userId",
});

Role.belongsToMany(User, {
  through: "UserRole",
  as: "users",
  foreignKey: "roleId",
});

export { User, Role, Member, Attendance, CashAdjustment };
export { PERMISSIONS, ROLE_PERMISSIONS, getPermissionsForRoles } from "../types";
export type { Permission } from "../types";
