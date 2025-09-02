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
    this.setupControllers();
    this.setupMiddleware();
    this.connectDb();
  }

   private setupMiddleware(): void {
    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(",").map(origin => origin.trim())
      : [
          "http://localhost:3000",
          "https://dashboard-teens.vercel.app"
        ];

    console.log("Allowed CORS Origins:", allowedOrigins);

    // Manual CORS handler
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const origin = req.headers.origin;
      
      if (!origin || allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin || '*');
      }
      
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,Accept,Origin');
      res.setHeader('Access-Control-Max-Age', '86400');

      // Handle preflight
      if (req.method === 'OPTIONS') {
        console.log('Handling preflight for:', req.path);
        res.sendStatus(204);
        return;
      }
      
      next();
    });

    this.app.use(express.json());

    this.app.get("/api/health", (req: Request, res: Response) => {
      res.status(200).json({ 
        status: "OK", 
        timestamp: new Date().toISOString(),
        cors: allowedOrigins 
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
