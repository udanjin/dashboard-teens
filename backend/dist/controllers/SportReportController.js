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
exports.SportReportController = void 0;
const core_1 = require("@overnightjs/core");
const SportReport_1 = __importDefault(require("../models/SportReport"));
let SportReportController = class SportReportController {
    getAllReports(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const reports = yield SportReport_1.default.findAll();
                res.json(reports);
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ error: 'Failed to fetch sport reports' });
            }
        });
    }
    getCash(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const totalPemasukan = yield SportReport_1.default.sum('totalPemasukan');
                const totalPengeluaran = yield SportReport_1.default.sum('totalPengeluaran');
                const cashBalance = totalPemasukan - totalPengeluaran;
                res.json(cashBalance);
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ error: 'Failed to calculate cash balance' });
            }
        });
    }
    createReport(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const report = yield SportReport_1.default.create(req.body);
                res.status(201).json(report);
            }
            catch (err) {
                console.error(err);
                res.status(400).json({ error: 'Failed to create sport report' });
            }
        });
    }
    updateReport(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                const report = yield SportReport_1.default.findByPk(id);
                if (!report) {
                    return res.status(404).json({ error: 'sport report not found' });
                }
                const updatedReport = yield report.update(req.body);
                res.json(updatedReport);
            }
            catch (err) {
                console.error(err);
                return res.status(400).json({ error: 'Failed to update Report' });
            }
        });
    }
    deleteReport(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            try {
                const report = yield SportReport_1.default.findByPk(id);
                if (!report) {
                    return res.status(404).json({ error: 'sport report not found' });
                }
                yield report.destroy();
                return res.status(200).json({ message: 'Report berhasil di hapus' });
            }
            catch (err) {
                console.error(err);
                return res.status(400).json({ error: 'Failed to delete the report' });
            }
        });
    }
};
exports.SportReportController = SportReportController;
__decorate([
    (0, core_1.Get)(''),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SportReportController.prototype, "getAllReports", null);
__decorate([
    (0, core_1.Get)('cash-balance'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SportReportController.prototype, "getCash", null);
__decorate([
    (0, core_1.Post)(''),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SportReportController.prototype, "createReport", null);
__decorate([
    (0, core_1.Put)(':id'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SportReportController.prototype, "updateReport", null);
__decorate([
    (0, core_1.Delete)(':id'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SportReportController.prototype, "deleteReport", null);
exports.SportReportController = SportReportController = __decorate([
    (0, core_1.Controller)('api/sport-reports')
], SportReportController);
