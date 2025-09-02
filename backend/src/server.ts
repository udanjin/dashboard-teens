import { Server as OvernightServer } from "@overnightjs/core";
import express, { Application, NextFunction } from "express";
import { Request, Response } from "express";
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
    this.setupCors();
    this.setupControllers();
    this.setupMiddleware();
    this.connectDb();
  }

 private setupCors(): void {
    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map(origin => origin.trim())
      : [
          "http://localhost:3000",
          "https://dashboard-teens.vercel.app"
        ];

    console.log("Allowed CORS Origins:", allowedOrigins);

    const corsOptions: CorsOptions = {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
      optionsSuccessStatus: 200
    };

    this.app.use(cors(corsOptions));
    this.app.options("*", cors(corsOptions));
  }

  private setupMiddleware(): void {
    this.app.use(express.json());

    this.app.get("/api/health", (req, res) => {
      res.status(200).json({ 
        status: "OK", 
        timestamp: new Date().toISOString()
      });
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
