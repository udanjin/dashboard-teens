"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FclController = void 0;
const core_1 = require("@overnightjs/core");
const User_1 = __importDefault(require("../models/User"));
const Member_1 = __importDefault(require("../models/Member"));
const auth_1 = require("../middleware/auth");
const Attendance_1 = __importDefault(require("../models/Attendance"));
const db_1 = __importDefault(require("../config/db"));
const roleAuth_1 = require("../middleware/roleAuth");
const sequelize_1 = require("sequelize");
const dayjs_1 = __importDefault(require("dayjs"));
let FclController = class FclController {
    addMembers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const { membersData } = req.body;
            const leaderId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            if (!Array.isArray(membersData) || membersData.length == 0) {
                return res.status(400).json({ error: "You must insert member Data" });
            }
            if (!leaderId) {
                return res.status(400).json({ error: "Unathourized" });
            }
            try {
                const leader = yield User_1.default.findByPk(leaderId);
                if (!leader) {
                    return res.status(404).json({ error: "leader not found" });
                }
                const memberInstances = yield Promise.all(membersData.map((memberInfo) => {
                    if (!memberInfo.name || !memberInfo.grade || !memberInfo.gender) {
                        throw new Error(`Invalid data for member: ${JSON.stringify(memberInfo)}`);
                    }
                    const gradeAsNumber = parseInt(memberInfo.grade, 10);
                    if (isNaN(gradeAsNumber)) {
                        throw new Error(`'grade' must be a valid number for member: ${memberInfo.name}`);
                    }
                    return Member_1.default.findOrCreate({
                        where: {
                            name: memberInfo.name,
                            grade: gradeAsNumber,
                            gender: memberInfo.gender,
                        },
                    });
                }));
                const members = memberInstances.map(([member]) => member);
                yield leader.addMembers(members);
                res
                    .status(201)
                    .json({ message: `${members.length} members added succesfully` });
            }
            catch (err) {
                console.log(err);
                res.status(500).json({ error: "Failed to add members" });
            }
        });
    }
    getMyMembers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const leaderId = req.user.userId;
            if (!leaderId) {
                return res.status(400).json({ error: "Unathourized" });
            }
            try {
                const leader = yield User_1.default.findByPk(leaderId, {
                    include: [
                        {
                            model: Member_1.default,
                            as: "members",
                            through: { attributes: [] },
                        },
                    ],
                });
                if (!leader) {
                    return res.status(404).json({ error: "leader not found" });
                }
                res.json(leader.members || []);
            }
            catch (err) {
                console.log(err);
                res.status(500).json({ error: "Failed to fetch Members" });
            }
        });
    }
    getFclSummary(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { month, year } = req.query;
                const targetDate = month && year ? (0, dayjs_1.default)(`${year}-${month}-01`) : (0, dayjs_1.default)();
                const startDate = targetDate.startOf("month").format("YYYY-MM-DD");
                const endDate = targetDate.endOf("month").format("YYYY-MM-DD");
                const leaders = yield User_1.default.findAll({
                    where: { role: { [sequelize_1.Op.in]: ["fcl", "leader", "admin"] } },
                    attributes: ["id", "username"],
                    include: [
                        {
                            model: Member_1.default,
                            as: "members",
                            attributes: ["id", "name", "grade", "gender"],
                            through: { attributes: [] },
                        },
                    ],
                });
                if (!leaders || leaders.length === 0) {
                    return res.json([]);
                }
                const allMemberIds = leaders.flatMap((leader) => leader.members.map((m) => m.id));
                const attendanceCounts = yield Attendance_1.default.findAll({
                    attributes: [
                        "memberId",
                        "status",
                        [sequelize_1.Sequelize.fn("COUNT", sequelize_1.Sequelize.col("id")), "count"],
                    ],
                    where: {
                        memberId: { [sequelize_1.Op.in]: allMemberIds },
                        status: { [sequelize_1.Op.in]: [0, 1] },
                        date: { [sequelize_1.Op.between]: [startDate, endDate] },
                    },
                    group: ["memberId", "status"],
                    raw: true,
                });
                const summaryData = leaders.map((leader) => {
                    const membersWithStats = leader.members.map((member) => {
                        const presentRecord = attendanceCounts.find((p) => p.memberId === member.id && p.status === 0);
                        const absentRecord = attendanceCounts.find((p) => p.memberId === member.id && p.status === 1);
                        return Object.assign(Object.assign({}, member.get({ plain: true })), { presentCount: presentRecord ? parseInt(presentRecord.count, 10) : 0, absentCount: absentRecord ? parseInt(absentRecord.count, 10) : 0 });
                    });
                    return {
                        leaderId: leader.id,
                        leaderName: leader.username,
                        members: membersWithStats,
                    };
                });
                res.json(summaryData);
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to fetch FCL summary" });
            }
        });
    }
    requestDeleteMember(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { reason } = req.body;
            const { id } = req.params;
            if (!reason || typeof reason !== "string" || reason.trim() === "") {
                return res
                    .status(400)
                    .json({ error: "A reason for deletion is required" });
            }
            try {
                const member = yield Member_1.default.findByPk(id);
                if (!member) {
                    return res.status(404).json({ error: "member not found" });
                }
                member.status = "pending_deletion";
                member.deletionReason = reason;
                yield member.save();
                return res.status(200).json({
                    message: "equest to delete member has been submitted for approval.",
                });
            }
            catch (err) {
                console.log(err);
                return res.status(400).json({ error: "failed to delete member" });
            }
        });
    }
    getFclWeeklyStats(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { month, year, gender, grade, leaderName } = req.query;
                const targetDate = month && year ? (0, dayjs_1.default)(`${year}-${month}-01`) : (0, dayjs_1.default)();
                const startDate = targetDate.startOf("month");
                const endDate = targetDate.endOf("month");
                const memberWhere = {};
                if (gender)
                    memberWhere.gender = gender;
                if (grade)
                    memberWhere.grade = parseInt(grade, 10);
                const leaderWhere = { role: { [sequelize_1.Op.in]: ["fcl", "leader", 'admin'] } };
                if (leaderName)
                    leaderWhere.username = leaderName;
                const leaders = yield User_1.default.findAll({
                    where: leaderWhere,
                    include: [
                        {
                            model: Member_1.default,
                            as: "members",
                            where: memberWhere,
                            attributes: ["id"],
                            required: false,
                        },
                    ],
                });
                // Kumpulkan ID leader dan member yang relevan
                const leaderIds = leaders.map((l) => l.id);
                const memberIds = leaders.flatMap((leader) => leader.members.map((m) => m.id));
                if (memberIds.length === 0) {
                    const emptySundays = this.getSundaysOfMonth(targetDate);
                    return res.json({
                        labels: emptySundays.map((_, i) => `Week ${i + 1}`),
                        data: emptySundays.map(() => 0),
                    });
                }
                const sundays = this.getSundaysOfMonth(targetDate).map((d) => d.format("YYYY-MM-DD"));
                // FIX: Menambahkan filter 'leaderId' ke dalam query absensi
                const weeklyCounts = yield Attendance_1.default.findAll({
                    attributes: [
                        "date",
                        [sequelize_1.Sequelize.fn("COUNT", sequelize_1.Sequelize.col("id")), "presentCount"],
                    ],
                    where: {
                        status: 0,
                        memberId: { [sequelize_1.Op.in]: memberIds },
                        leaderId: { [sequelize_1.Op.in]: leaderIds }, // <-- Perbaikan ada di sini
                        date: { [sequelize_1.Op.in]: sundays },
                    },
                    group: ["date"],
                    raw: true,
                });
                const labels = sundays.map((_, index) => `Week ${index + 1}`);
                const data = sundays.map((sundayDate) => {
                    const record = weeklyCounts.find((c) => (0, dayjs_1.default)(c.date).isSame(sundayDate, "day"));
                    return record ? parseInt(record.presentCount, 10) : 0;
                });
                res.json({ labels, data });
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to fetch weekly stats" });
            }
        });
    }
    getSundaysOfMonth(date) {
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
    getDeletionRequest(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const req = yield Member_1.default.findAll({
                    where: {
                        status: "pending_deletion",
                    },
                    attributes: ["id", "name", "grade", "gender", "deletionReason"],
                });
                res.json(req);
            }
            catch (err) {
                console.log(err);
                res.status(500).json({ error: "Failed to fetch deletion request" });
            }
        });
    }
    approveDeleteMember(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const transaction = yield db_1.default.transaction();
            try {
                const member = yield Member_1.default.findByPk(id, { transaction });
                if (!member) {
                    yield transaction.rollback();
                    return res
                        .status(404)
                        .json({ error: "Member not found or already processed" });
                }
                yield Attendance_1.default.destroy({ where: { memberId: id }, transaction });
                yield member.destroy({ transaction });
                yield transaction.commit();
                return res
                    .status(200)
                    .json({ message: "Member deletion approved and completed." });
            }
            catch (err) {
                console.error(err);
                return res.status(500).json({ error: "Failed to approve deletion" });
            }
        });
    }
    rejectDeletion(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                const member = yield Member_1.default.findByPk(id);
                if (!member) {
                    return res
                        .status(404)
                        .json({ error: "Member not found or already processed" });
                }
                member.status = "active";
                member.deletionReason = null;
                yield member.save();
                return res
                    .status(200)
                    .json({ message: "Member deletion request has been rejected." });
            }
            catch (err) {
                console.error(err);
                return res.status(500).json({ error: "Failed to reject deletion" });
            }
        });
    }
};
exports.FclController = FclController;
__decorate([
    (0, core_1.Post)("members"),
    (0, core_1.Middleware)(auth_1.authMiddleware),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FclController.prototype, "addMembers", null);
__decorate([
    (0, core_1.Get)("my-members"),
    (0, core_1.Middleware)(auth_1.authMiddleware),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FclController.prototype, "getMyMembers", null);
__decorate([
    (0, core_1.Get)("fcl-summary"),
    (0, core_1.Middleware)([auth_1.authMiddleware, (0, roleAuth_1.roleAuthMiddleware)(["admin", "fcl"])]),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FclController.prototype, "getFclSummary", null);
__decorate([
    (0, core_1.Put)("request-delete/:id"),
    (0, core_1.Middleware)(auth_1.authMiddleware),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FclController.prototype, "requestDeleteMember", null);
__decorate([
    (0, core_1.Get)("weekly-stats"),
    (0, core_1.Middleware)([auth_1.authMiddleware, (0, roleAuth_1.roleAuthMiddleware)(["admin", "fcl", "leader"])]),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FclController.prototype, "getFclWeeklyStats", null);
__decorate([
    (0, core_1.Get)("deletion-request"),
    (0, core_1.Middleware)([auth_1.authMiddleware, (0, roleAuth_1.roleAuthMiddleware)(["admin", "fcl"])]),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FclController.prototype, "getDeletionRequest", null);
__decorate([
    (0, core_1.Delete)("approve-deletion/:id"),
    (0, core_1.Middleware)([auth_1.authMiddleware, (0, roleAuth_1.roleAuthMiddleware)(["admin", "fcl"])]),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FclController.prototype, "approveDeleteMember", null);
__decorate([
    (0, core_1.Put)("reject-deletion/:id"),
    (0, core_1.Middleware)([auth_1.authMiddleware, (0, roleAuth_1.roleAuthMiddleware)(["admin", "fcl"])]),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], FclController.prototype, "rejectDeletion", null);
exports.FclController = FclController = __decorate([
    (0, core_1.Controller)("api/fcl")
], FclController);
