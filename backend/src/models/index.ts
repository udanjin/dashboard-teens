import User from "./User";
import Member from "./Member";
import Role from "./Role";
import Attendance from "./Attendance";
import SportReport from "./SportReport";
import CashAdjustment from "./CashAdjustment";
import SportInventory from "./SportInventory";
import FamilyCell from "./FamilyCell";

SportReport.belongsTo(User, { as: "creator", foreignKey: "createdById" });
CashAdjustment.belongsTo(User, { as: "creator", foreignKey: "createdById" });
SportInventory.belongsTo(User, { as: "creator", foreignKey: "createdById" });

FamilyCell.hasMany(User, { as: "leaders", foreignKey: "fcId" });
User.belongsTo(FamilyCell, { as: "familyCell", foreignKey: "fcId" });

FamilyCell.hasMany(Member, { as: "members", foreignKey: "fcId" });
Member.belongsTo(FamilyCell, { as: "familyCell", foreignKey: "fcId" });

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

export { User, Role, Member, Attendance, CashAdjustment, SportInventory, FamilyCell };
export { PERMISSIONS, ROLE_PERMISSIONS, getPermissionsForRoles } from "../types";
export type { Permission } from "../types";
