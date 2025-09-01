"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authMiddleware = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            const decoded = jsonwebtoken_1.default.verify(token, 'your-jwt-secret');
            req.user = {
                userId: decoded.userId,
                username: decoded.username,
            };
            next();
        }
        catch (error) {
            // FIX: Kata 'return' dihapus dari sini
            res.status(401).json({ error: 'Unauthorized: Invalid token' });
        }
    }
    else {
        // FIX: Kata 'return' juga dihapus dari sini
        res.status(401).json({ error: 'Unauthorized: No token provided' });
    }
};
exports.authMiddleware = authMiddleware;
