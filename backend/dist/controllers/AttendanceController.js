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
exports.AttendanceController = void 0;
const core_1 = require("@overnightjs/core");
const User_1 = __importDefault(require("../models/User"));
const Member_1 = __importDefault(require("../models/Member"));
const auth_1 = require("../middleware/auth");
const Attendance_1 = __importDefault(require("../models/Attendance"));
const sequelize_1 = require("sequelize");
const db_1 = __importDefault(require("../config/db"));
const dayjs_1 = __importDefault(require("dayjs"));
let AttendanceController = class AttendanceController {
    getAttendanceSheet(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const leaderId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const { date } = req.query;
            if (!leaderId || !date || typeof date !== "string") {
                return res.status(400).json({ error: "Leader ID and date are required" });
            }
            try {
                const leader = yield User_1.default.findByPk(leaderId, {
                    include: [{ model: Member_1.default, as: "members", attributes: ["id", "name"] }],
                });
                if (!leader)
                    return res.status(404).json({ error: "Leader not found" });
                const members = leader.members || [];
                const memberIds = members.map((m) => m.id);
                const existingAttendances = yield Attendance_1.default.findAll({
                    where: { memberId: { [sequelize_1.Op.in]: memberIds }, leaderId, date },
                });
                const attendanceSheet = members.map((member) => {
                    const attendanceRecord = existingAttendances.find((a) => a.memberId === member.id);
                    return {
                        memberId: member.id,
                        name: member.name,
                        status: attendanceRecord ? attendanceRecord.status : null,
                    };
                });
                res.json(attendanceSheet);
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to fetch attendance sheet" });
            }
        });
    }
    submitAttendance(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const leaderId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const { date, attendances } = req.body;
            if (!leaderId || !date || !Array.isArray(attendances)) {
                return res.status(400).json({ error: "Invalid payload" });
            }
            const transaction = yield db_1.default.transaction();
            try {
                // 1. Pisahkan data yang akan dihapus dan yang akan di-upsert
                const toDelete = attendances
                    .filter((att) => att.status === null)
                    .map((att) => att.memberId);
                const toUpsert = attendances
                    .filter((att) => att.status !== null)
                    .map((att) => ({
                    leaderId,
                    memberId: att.memberId,
                    date,
                    status: att.status,
                }));
                // 2. Hapus data yang statusnya diubah menjadi null (unmarked)
                if (toDelete.length > 0) {
                    yield Attendance_1.default.destroy({
                        where: {
                            leaderId,
                            date,
                            memberId: { [sequelize_1.Op.in]: toDelete },
                        },
                        transaction,
                    });
                }
                // 3. Lakukan upsert untuk data yang statusnya present (0) atau absent (1)
                if (toUpsert.length > 0) {
                    yield Attendance_1.default.bulkCreate(toUpsert, {
                        updateOnDuplicate: ["status"], // Perbarui status jika data sudah ada
                        transaction,
                    });
                }
                yield transaction.commit();
                res.status(200).json({ message: "Attendance submitted successfully" });
            }
            catch (err) {
                yield transaction.rollback();
                console.error(err);
                res.status(500).json({ error: "Failed to submit attendance" });
            }
        });
    }
    getAllAttendance(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const leaderId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
            const { month, year } = req.query;
            if (!leaderId || !month || !year) {
                return res
                    .status(400)
                    .json({ error: "Leader ID, month and year are required" });
            }
            try {
                const startDate = (0, dayjs_1.default)(`${year}-${month}-01`).startOf("month");
                const endDate = startDate.endOf("month");
                const leader = yield User_1.default.findByPk(leaderId, {
                    include: [{ model: Member_1.default, as: "members", attributes: ["id", "name"] }],
                });
                if (!leader)
                    return res.status(404).json({ error: "Leader not found" });
                const members = leader.members || [];
                if (members.length === 0) {
                    return res.json({ memberStats: [] });
                }
                const memberIds = members.map((m) => m.id);
                const attendanceCount = yield Attendance_1.default.findAll({
                    attributes: [
                        "memberId",
                        "status",
                        [sequelize_1.Sequelize.fn("COUNT", sequelize_1.Sequelize.col("id")), "count"],
                    ],
                    where: {
                        leaderId,
                        memberId: { [sequelize_1.Op.in]: memberIds },
                        status: { [sequelize_1.Op.in]: [0, 1] },
                        date: {
                            [sequelize_1.Op.between]: [
                                startDate.format("YYYY-MM-DD"),
                                endDate.format("YYYY-MM-DD"),
                            ],
                        },
                    },
                    group: ["memberId", "status"],
                    raw: true,
                });
                const memberStats = members.map((member) => {
                    let presentCount = 0;
                    let absentCount = 0;
                    const recordsForMember = attendanceCount.filter((p) => p.memberId === member.id);
                    recordsForMember.forEach(record => {
                        if (record.status === 0) {
                            presentCount = parseInt(record.count, 10);
                        }
                        else if (record.status === 1) {
                            absentCount = parseInt(record.count, 10);
                        }
                    });
                    // console.log(absentCount);
                    return {
                        memberId: member.id,
                        name: member.name,
                        presentCount,
                        absentCount,
                    };
                });
                res.json({ memberStats });
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to calculate attendance" });
            }
        });
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, core_1.Get)("sheet"),
    (0, core_1.Middleware)(auth_1.authMiddleware),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getAttendanceSheet", null);
__decorate([
    (0, core_1.Post)(""),
    (0, core_1.Middleware)(auth_1.authMiddleware),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "submitAttendance", null);
__decorate([
    (0, core_1.Get)("single-attendance"),
    (0, core_1.Middleware)(auth_1.authMiddleware),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getAllAttendance", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, core_1.Controller)("api/attendance")
], AttendanceController);
