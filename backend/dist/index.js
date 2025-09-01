"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const server_1 = __importDefault(require("./server")); // Impor app yang sudah diekspor dari Server.ts
const PORT = process.env.PORT || 3000;
server_1.default.listen(PORT, () => {
    console.log(`🚀 Local server running on http://localhost:${PORT}`);
});
