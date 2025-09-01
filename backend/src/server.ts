// src/Server.ts
import { Server as OvernightServer } from "@overnightjs/core";
import express, { Application } from "express"; // Impor Application
import { AuthController } from "./controllers/AuthController";
import sequelize from "./config/db";
import cors from "cors";
import { SportReportController } from "./controllers/SportReportController";
import { FclController } from "./controllers/FclController";
import { AttendanceController } from "./controllers/AttendanceController";
import "./models";

export class Server extends OvernightServer {
  constructor() {
    super();
    this.setupMiddleware();
    this.setupControllers();
    this.connectDb(); // Panggil koneksi DB di constructor
  }

  private setupMiddleware(): void {
    // Sesuaikan dengan panduan Vercel
    const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : [];
    const corsOptions: cors.CorsOptions = {
      origin: allowedOrigins,
    };

    this.app.use(cors(corsOptions));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    this.app.get("/health", (req, res) => {
      res.json({ status: "OK", timestamp: new Date().toISOString() });
    });
  }

  private setupControllers(): void {
    super.addControllers([
      new AuthController(),
      new SportReportController(),
      new FclController(),
      new AttendanceController(),
    ]);
  }

  // Pindahkan logika koneksi dan sinkronisasi ke sini
  private async connectDb(): Promise<void> {
    try {
      await sequelize.authenticate();
      console.log("✅ Connected to Supabase Postgres");
      await sequelize.sync({ alter: true });
      console.log("Database & tables synchronized!");
    } catch (err) {
      console.error("❌ Failed to connect to DB:", err);
      process.exit(1);
    }
  }

  // Metode start() tidak lagi diperlukan untuk Vercel
  // public async start(port: number): Promise<void> { ... }

  public getApp(): Application {
    return this.app;
  }
}

// Buat instance server dan ekspor app-nya untuk Vercel
const server = new Server();
export default server.getApp();
