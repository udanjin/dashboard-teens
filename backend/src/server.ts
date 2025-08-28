// src/Server.ts
import { Server as OvernightServer } from "@overnightjs/core";
import express from "express";
import { AuthController } from "./controllers/AuthController"; // Import the AuthController
import sequelize from "./config/db";
import cors from "cors";
import { SportReportController } from "./controllers/SportReportController";
import { FclController } from "./controllers/FclController";
import { AttendanceController } from "./controllers/AttendanceController";
import "./models";

export class Server extends OvernightServer {
  // Make sure to export the class here
  constructor() {
    super();
    this.setupMiddleware();
    this.setupControllers();
  }

  private setupMiddleware(): void {
    // CORS configuration for production
    const corsOptions = {
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
      credentials: true,
    };

    this.app.use(cors(corsOptions));
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Health check endpoint
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
    ]); // Add AuthController here
  }

  public async start(port: number): Promise<void> {
    try {
      await sequelize.authenticate();
      console.log("✅ Connected to Supabase Postgres");

      // Sync database
      if (process.env.NODE_ENV === "production") {
        await sequelize.sync({ alter: false }); // Safer for production
      } else {
        await sequelize.sync({ alter: true });
      }

      console.log("Database & tables synchronized!");

      this.app.listen(port, "0.0.0.0", () => {
        console.log(`🚀 Server started on port ${port}`);
      });
    } catch (err) {
      console.error("❌ Failed to connect to DB:", err);
      process.exit(1);
    }
  }
}
