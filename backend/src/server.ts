// server.ts - FIXED VERSION - STEP BY STEP
import { Server as OvernightServer } from "@overnightjs/core";
import express, { NextFunction } from "express";
import { Request, Response } from "express";
import cors, { CorsOptions } from "cors";

console.log("🔥 Starting server initialization...");

// REMOVE THIS LINE TEMPORARILY - this might be causing the hang
import "./models";

console.log("🔥 Imports completed, creating server class...");

export class Server extends OvernightServer {
  constructor() {
    console.log("🏗️  Server constructor started");
    super();
    console.log("🏗️  OvernightServer initialized");
    
    this.setupMiddleware();
    console.log("✅ Middleware setup completed");

    // COMMENT OUT CONTROLLERS TEMPORARILY
    this.setupControllers();
    console.log("✅ Controllers setup skipped for debugging");

    console.log("🏗️  Server constructor completed");
  }

  public async start(port: number): Promise<void> {
    console.log("🚀 Start method called with port:", port);
    
    // COMMENT OUT DATABASE CONNECTION TEMPORARILY
    try {
      console.log("🔌 Attempting database connection...");
      await this.connectDb();
      console.log("✅ Database connection successful");
    } catch (error) {
      console.error("❌ Database connection failed:", error);
    }
    
    console.log("⚠️  Database connection skipped for debugging");

    console.log("🌐 About to call app.listen...");
    
    return new Promise<void>((resolve) => {
      const server = this.app.listen(port, "0.0.0.0", () => {
        console.log(`🚀 Server successfully running on port ${port}`);
        console.log(`📊 Health check: http://localhost:${port}/api/health`);
        console.log(`🌍 Server URL: http://localhost:${port}`);
        resolve();
      });

      server.on('error', (error) => {
        console.error("❌ Server error:", error);
      });
    });
  }

  private setupMiddleware(): void {
    console.log("⚙️  Setting up middleware...");

    // Basic request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      console.log(`${req.method} ${req.url}`);
      next();
    });

    // CORS setup
    // const allowedOrigins = ["http://localhost:3000", "https://dashboard-teens.vercel.app"];
    // console.log("🌐 CORS Origins:", allowedOrigins);

    const corsOptions: CorsOptions = {
      origin: "*",
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
      allowedHeaders: ["Content-Type", "Authorization"],
    };

    this.app.use(cors(corsOptions));
    this.app.options('*', cors(corsOptions));
    this.app.use(express.json());

    // Simple health check
    this.app.get("/api/health", (req: Request, res: Response) => {
      console.log("🏥 Health check requested");
      res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        message: "Server is running - basic version"
      });
    });

    console.log("⚙️  Middleware setup completed");
  }

  // COMMENT OUT THESE METHODS FOR NOW
  
  private setupControllers(): void {
    console.log("🎮 Setting up controllers...");
    
    try {
      // Import controllers here instead of at the top
      const { AuthController } = require("./controllers/AuthController");
      const { SportReportController } = require("./controllers/SportReportController");
      const { FclController } = require("./controllers/FclController");
      const { AttendanceController } = require("./controllers/AttendanceController");

      console.log("🔐 Initializing AuthController...");
      const authController = new AuthController();
      
      console.log("⚽ Initializing SportReportController...");
      const sportController = new SportReportController();
      
      console.log("📋 Initializing FclController...");
      const fclController = new FclController();
      
      console.log("📊 Initializing AttendanceController...");
      const attendanceController = new AttendanceController();

      console.log("🔗 Adding controllers to server...");
      super.addControllers([
        authController,
        sportController,
        fclController,
        attendanceController,
      ]);
      
      console.log("🎮 Controllers setup completed");
    } catch (error) {
      console.error("❌ Controller setup error:", error);
      throw error;
    }
  }

  private async connectDb(): Promise<void> {
    console.log("🔌 Database connection attempt starting...");
    
    try {
      const sequelize = require("./config/db").default;
      
      console.log("🔍 Testing database authentication...");
      await sequelize.authenticate();
      console.log("✅ Database authentication successful");
      
      console.log("🔄 Syncing database schema...");
      await sequelize.sync({ alter: true });
      console.log("✅ Database sync completed");
      
    } catch (error) {
      console.error("❌ Database connection failed:");
      console.error("Error name:", (error as Error)?.name);
      console.error("Error message:", (error as Error)?.message);
      throw error;
    }
  }
  
}

console.log("🔥 Server class definition completed");