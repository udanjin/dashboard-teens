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
    this.app.use(cors());
    this.app.use(express.json());
    this.setupControllers();
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
      await sequelize.sync();
      console.log("✅ Connected to Supabase Postgres");
      this.app.listen(port, () =>
        console.log(`🚀 Server started on http://localhost:${port}`)
      );
      sequelize.sync({ alter: true }).then(() => {
        console.log("Database & tables synchronized!");
      });
    } catch (err) {
      console.error("❌ Failed to connect to DB:", err);
    }
  }
}
