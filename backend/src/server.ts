import { Server as OvernightServer } from "@overnightjs/core";
import express, { NextFunction, Request, Response } from "express";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser";

import "./models";

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "https://dashboard-teens.vercel.app",
  "https://www.atmosphereteens.my.id",
  "https://atmosphereteens.my.id",
  "https://api.atmosphereteens.my.id",
];

export class Server extends OvernightServer {
  constructor() {
    super();
    this.setupMiddleware();
    this.setupControllers();
  }

  public async start(port: number): Promise<void> {
    await this.connectDb();

    return new Promise<void>((resolve) => {
      const server = this.app.listen(port, "0.0.0.0", () => {
        console.log(`Server running on http://localhost:${port}`);
        // console.log(`process.env: ${JSON.stringify(process.env, null, 2)}`);
        resolve();
      });

      server.on("error", (error) => {
        console.error("Server error:", error);
      });
    });
  }

  private setupMiddleware(): void {
    this.app.set("trust proxy", 1);
    const corsOptions: CorsOptions = {
      origin: ALLOWED_ORIGINS,
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
    };

    this.app.use(cors(corsOptions));
    this.app.use(cookieParser());
    this.app.use(express.json());

    this.app.get("/api/health", (_req: Request, res: Response) => {
      res.json({ status: "OK", timestamp: new Date().toISOString() });
    });
  }

  private setupControllers(): void {
    const { AuthController } = require("./controllers/AuthController");
    const { SportReportController } = require("./controllers/SportReportController");
    const { FclController } = require("./controllers/FclController");
    const { AttendanceController } = require("./controllers/AttendanceController");

    super.addControllers([
      new AuthController(),
      new SportReportController(),
      new FclController(),
      new AttendanceController(),
    ]);
  }

  private async connectDb(): Promise<void> {
    const sequelize = require("./config/db").default;

    await sequelize.authenticate();
    console.log("Database connected");

    await sequelize.sync({ alter: true });
    console.log("Database synced");
  }
}
