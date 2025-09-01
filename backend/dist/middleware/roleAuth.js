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
exports.roleAuthMiddleware = void 0;
const User_1 = __importDefault(require("../models/User"));
// Middleware ini adalah sebuah fungsi yang mengembalikan fungsi lain (higher-order function).
// Ini memungkinkan kita untuk memberikan argumen 'allowedRoles' saat menggunakannya.
const roleAuthMiddleware = (allowedRoles) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        var _a;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        // Sebenarnya validasi ini sudah dilakukan oleh authMiddleware,
        // tapi ini adalah lapisan pengaman tambahan.
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        try {
            // Cari pengguna di database untuk mendapatkan role-nya
            const user = yield User_1.default.findByPk(userId);
            // Jika pengguna tidak ditemukan atau tidak memiliki role
            if (!user || !user.role) {
                return res.status(403).json({ error: 'Forbidden: No role assigned' });
            }
            // Periksa apakah role pengguna ada di dalam daftar role yang diizinkan
            if (allowedRoles.includes(user.role)) {
                // Jika diizinkan, lanjutkan ke fungsi controller berikutnya
                next();
            }
            else {
                // Jika tidak, kirim error 403 Forbidden
                return res.status(403).json({ error: 'Forbidden: You do not have permission for this action' });
            }
        }
        catch (error) {
            console.error("Role auth error:", error);
            return res.status(500).json({ error: 'Internal server error' });
        }
    });
};
exports.roleAuthMiddleware = roleAuthMiddleware;
