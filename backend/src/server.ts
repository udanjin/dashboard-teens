// server.ts - CORRECTED VERSION

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
    // These are synchronous and are safe for the constructor
    this.setupMiddleware();
    this.setupControllers();
  }

  // NEW public start method
  public async start(port: number): Promise<void> {
    await this.connectDb(); // Wait for the DB connection to complete
    this.app.listen(port, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${port}`);
    });
  }

  private setupMiddleware(): void {
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log("Request Origin:", req.headers.origin);
      console.log("Request Method:", req.method);
      console.log("Request URL:", req.url);
      next();
    });
    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map((origin) => origin.trim())
      : ["http://localhost:3000", "https://dashboard-teens.vercel.app"];

    console.log("Allowed CORS Origins:", allowedOrigins);

    const corsOptions: CorsOptions = {
      origin: allowedOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
      optionsSuccessStatus: 200,
    };

    this.app.use(cors(corsOptions));
    this.app.use(express.json());

    this.app.get("/api/health", (req, res) => {
      res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
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
      console.log("Attempting to connect to the database...");
      await sequelize.authenticate();
      await sequelize.sync({ alter: true });
      console.log("✅ Database connection and sync successful.");
    } catch (err) {
      console.error("❌ Failed to connect to DB:", err);
      console.error("Error details:", err);
      process.exit(1); // Exit if DB connection fails
    }
  }
}
