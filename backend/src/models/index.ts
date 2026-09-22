import User from "./User";
import Member from "./Member";
import Role from "./Role";
import Attendance from "./Attendance";
import SportReport from "./SportReport";
import CashAdjustment from "./CashAdjustment";
import SportInventory from "./SportInventory";
import FamilyCell from "./FamilyCell";
import AttendanceHistory from "./AttendanceHistory";

SportReport.belongsTo(User, { as: "creator", foreignKey: "createdById" });
CashAdjustment.belongsTo(User, { as: "creator", foreignKey: "createdById" });
SportInventory.belongsTo(User, { as: "creator", foreignKey: "createdById" });

FamilyCell.hasMany(User, { as: "leaders", foreignKey: "fcId" });
User.belongsTo(FamilyCell, { as: "familyCell", foreignKey: "fcId" });

FamilyCell.hasMany(Member, { as: "members", foreignKey: "fcId" });
Member.belongsTo(FamilyCell, { as: "familyCell", foreignKey: "fcId" });

// Allow direct access from Leader to Members sharing the same Family Cell
User.hasMany(Member, { as: "members", foreignKey: "fcId", sourceKey: "fcId" });
Member.belongsTo(User, { as: "leader", foreignKey: "fcId", targetKey: "fcId" });

AttendanceHistory.belongsTo(User, { as: "Updater", foreignKey: "updatedBy" });
User.hasMany(AttendanceHistory, { as: "updates", foreignKey: "updatedBy" });

AttendanceHistory.belongsTo(Member, { as: "member", foreignKey: "memberId" });
Member.hasMany(AttendanceHistory, { as: "history", foreignKey: "memberId" });

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

export { User, Role, Member, Attendance, CashAdjustment, SportInventory, FamilyCell, AttendanceHistory };
export { PERMISSIONS, ROLE_PERMISSIONS, getPermissionsForRoles } from "../types";
export type { Permission } from "../types";
