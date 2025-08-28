import User from "./User";
import Member from "./Member";
// import SportReport from "./SportReport";

User.belongsToMany(Member,{
    through: 'LeaderMember',
    as: 'members',
    foreignKey: 'leaderId'
});

Member.belongsToMany(User,{
    through: 'LeaderMember',
    as:'leaders',
    foreignKey: 'memberId'
});

