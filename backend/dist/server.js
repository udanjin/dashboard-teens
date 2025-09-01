"use strict";
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
exports.Server = void 0;
// src/Server.ts
const core_1 = require("@overnightjs/core");
const express_1 = __importDefault(require("express")); // Impor Application
const AuthController_1 = require("./controllers/AuthController");
const db_1 = __importDefault(require("./config/db"));
const cors_1 = __importDefault(require("cors"));
const SportReportController_1 = require("./controllers/SportReportController");
const FclController_1 = require("./controllers/FclController");
const AttendanceController_1 = require("./controllers/AttendanceController");
require("./models");
class Server extends core_1.Server {
    constructor() {
        super();
        this.setupMiddleware();
        this.setupControllers();
        this.connectDb(); // Panggil koneksi DB di constructor
    }
    setupMiddleware() {
        // Sesuaikan dengan panduan Vercel
        const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
        const corsOptions = {
            origin: allowedOrigins,
        };
        this.app.use((0, cors_1.default)(corsOptions));
        this.app.use(express_1.default.json());
        this.app.use(express_1.default.urlencoded({ extended: true }));
        this.app.get("/health", (req, res) => {
            res.json({ status: "OK", timestamp: new Date().toISOString() });
        });
    }
    setupControllers() {
        super.addControllers([
            new AuthController_1.AuthController(),
            new SportReportController_1.SportReportController(),
            new FclController_1.FclController(),
            new AttendanceController_1.AttendanceController(),
        ]);
    }
    // Pindahkan logika koneksi dan sinkronisasi ke sini
    connectDb() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield db_1.default.authenticate();
                console.log("✅ Connected to Supabase Postgres");
                yield db_1.default.sync({ alter: true });
                console.log("Database & tables synchronized!");
            }
            catch (err) {
                console.error("❌ Failed to connect to DB:", err);
                process.exit(1);
            }
        });
    }
    // Metode start() tidak lagi diperlukan untuk Vercel
    // public async start(port: number): Promise<void> { ... }
    getApp() {
        return this.app;
    }
}
exports.Server = Server;
// Buat instance server dan ekspor app-nya untuk Vercel
const server = new Server();
exports.default = server.getApp();
