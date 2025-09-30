import User from "./User";
import Member from "./Member";
import Role from "./Role";
import Attendance from "./Attendance";

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
  through: "UserRole", // The name of the junction table
  as: "roles",
  foreignKey: "userId",
});

Role.belongsToMany(User, {
  through: "UserRole",
  as: "users",
  foreignKey: "roleId",
});

export { User, Role, Member, Attendance };
