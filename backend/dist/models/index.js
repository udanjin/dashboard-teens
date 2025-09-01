"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = __importDefault(require("./User"));
const Member_1 = __importDefault(require("./Member"));
// import SportReport from "./SportReport";
User_1.default.belongsToMany(Member_1.default, {
    through: 'LeaderMember',
    as: 'members',
    foreignKey: 'leaderId'
});
Member_1.default.belongsToMany(User_1.default, {
    through: 'LeaderMember',
    as: 'leaders',
    foreignKey: 'memberId'
});
