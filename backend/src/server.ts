import { Server as OvernightServer } from "@overnightjs/core";
import express, { Application, Request, Response } from "express";
import { AuthController } from "./controllers/AuthController";
import sequelize from "./config/db";
import cors, { CorsOptions } from "cors";
import { SportReportController } from "./controllers/SportReportController";
import { FclController } from "./controllers/FclController";
import { AttendanceController } from "./controllers/AttendanceController";
import "./models";

export class Server extends OvernightServer {
  constructor() {
    super();
    this.setupControllers();
    this.setupMiddleware();
    this.connectDb();
  }

  private setupMiddleware(): void {
    // --- KONFIGURASI CORS YANG LEBIH KUAT ---
    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",")
      : ["http://localhost:3000"];

    // Log ini akan muncul di Vercel dan memberitahu kita nilai yang sebenarnya
    console.log("Allowed CORS Origins:", allowedOrigins);

    const corsOptions: CorsOptions = {
      origin: (origin, callback) => {
        // Izinkan permintaan tanpa origin (seperti dari Postman atau aplikasi mobile)
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      credentials: true,
    };

    this.app.use(cors(corsOptions));
    this.app.use(express.json());

    this.app.get("/api/health", (req: Request, res: Response) => {
      res
        .status(200)
        .json({ status: "OK", timestamp: new Date().toISOString() });
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

  private async connectDb(): Promise<void> {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ alter: true });
      console.log("✅ Database connection and sync successful.");
    } catch (err) {
      console.error("❌ Failed to connect to DB:", err);
    }
  }

  public getApp(): Application {
    return this.app;
  }
}

const server = new Server();
export default server.getApp();
