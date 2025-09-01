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
exports.AuthController = void 0;
const core_1 = require("@overnightjs/core");
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
// 1. Impor middleware dan interface AuthenticatedRequest
const auth_1 = require("../middleware/auth"); // Pastikan path ini benar
let AuthController = class AuthController {
    // Endpoint ini tetap publik, tidak perlu middleware
    register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username, password } = req.body;
            if (!username || !password) {
                return res
                    .status(400)
                    .json({ error: "Username and password are required" });
            }
            try {
                const existingUser = yield User_1.default.findOne({ where: { username } });
                if (existingUser) {
                    return res.status(400).json({ error: "Username is already taken" });
                }
                const hashedPassword = yield bcrypt_1.default.hash(password, 10);
                const newUser = yield User_1.default.create({
                    username,
                    password: hashedPassword,
                    status: "pending",
                    role: null,
                });
                res
                    .status(201)
                    .json({ message: "User registered successfully, pending approval." });
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to register user" });
            }
        });
    }
    // Endpoint ini sekarang dilindungi oleh middleware
    getPendingUsers(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pendingUsers = yield User_1.default.findAll({
                    where: { status: "pending" },
                    attributes: ["id", "username", "status", "createdAt"],
                });
                res.json(pendingUsers);
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to fetch pending users" });
            }
        });
    }
    // Endpoint ini juga dilindungi oleh middleware
    approveUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = req.params;
            const { role } = req.body;
            // console.log(role);
            if (!role) {
                return res.status(400).json({ error: "Role is required" });
            }
            try {
                const user = yield User_1.default.findByPk(id);
                const validRoles = ["admin", "fcl", "leader", "sports"];
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                if (!validRoles.includes(role)) {
                    return res.status(400).json({
                        error: `Invalid role specified. Must be one of: ${validRoles.join(", ")}`,
                    });
                }
                user.status = "approved";
                user.role = role;
                yield user.save();
                res.json({
                    message: `User ${user.username} has been approved as ${role}.`,
                });
            }
            catch (err) {
                console.error(err);
                res.status(500).json({ error: "Failed to approve user" });
            }
        });
    }
    // Endpoint login juga tetap publik
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            const { username, password } = req.body;
            if (!username || !password) {
                return res
                    .status(400)
                    .json({ error: "Username and password are required" });
            }
            const user = yield User_1.default.findOne({ where: { username } });
            if (!user) {
                return res.status(400).json({ error: "Invalid username or password" });
            }
            if (user.status !== "approved") {
                return res.status(403).json({
                    error: "Your account has not been approved by an administrator yet.",
                });
            }
            const validPassword = yield bcrypt_1.default.compare(password, user.password);
            if (!validPassword) {
                return res.status(400).json({ error: "Invalid username or password" });
            }
            const token = jsonwebtoken_1.default.sign({ userId: user.id, username: user.username }, "your-jwt-secret", { expiresIn: "1h" });
            res.json({
                message: "Login successful",
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                },
            });
        });
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, core_1.Post)("register"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, core_1.Get)("pending"),
    (0, core_1.Middleware)(auth_1.authMiddleware),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "getPendingUsers", null);
__decorate([
    (0, core_1.Put)("approve/:id"),
    (0, core_1.Middleware)(auth_1.authMiddleware),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "approveUser", null);
__decorate([
    (0, core_1.Post)("login"),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
exports.AuthController = AuthController = __decorate([
    (0, core_1.Controller)("api/users")
], AuthController);
