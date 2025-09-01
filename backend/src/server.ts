import { Server as OvernightServer } from "@overnightjs/core";
import express, { Application } from "express";
import { AuthController } from "./controllers/AuthController";
import sequelize from "./config/db";
import cors from "cors";
import { SportReportController } from "./controllers/SportReportController";
import { FclController } from "./controllers/FclController";
import { AttendanceController } from "./controllers/AttendanceController";
import './models';

export class Server extends OvernightServer {
  constructor() {
    super();
    this.setupMiddleware();
    this.setupControllers();
    this.connectDb();
  }

  private setupMiddleware(): void {
    // Menggunakan environment variable untuk CORS
    const corsOptions = {
      origin: process.env.CORS_ORIGIN?.split(',') || "http://localhost:3000",
    };
    this.app.use(cors(corsOptions));
    this.app.use(express.json());
    this.app.get('/', (req, res) => {
    res.json({ 
      status: 'Server running',
      timestamp: new Date().toISOString()
    });
  });

  this.app.get('/health', (req, res) => {
    res.json({ status: 'OK' });
  });
  }

  private setupControllers(): void {
    super.addControllers([
      new AuthController(),
      new SportReportController(),
      new FclController(),
      new AttendanceController(),
    ]);
    console.log(`✅ Controllers added successfully`);
  }
  
  // Memisahkan koneksi DB agar bisa dipanggil di constructor
  private async connectDb(): Promise<void> {
    try {
      await sequelize.authenticate();
      await sequelize.sync({ alter: true });
      console.log("✅ Database connection and sync successful.");
    } catch (err) {
      console.error("❌ Failed to connect to DB:", err);
      // process.exit(1);
    }
  }
  
  // Getter untuk Vercel
  public getApp(): Application {
    return this.app;
  }
}

// Ekspor instance app untuk Vercel
const server = new Server();
export default server.getApp();