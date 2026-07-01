import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

import icpRoutes from "./routes/icpRoutes";
import leadRoutes from "./routes/leadRoutes";
import emailRoutes from "./routes/emailRoutes";
import sequenceRoutes from "./routes/sequenceRoutes";
import copywritingRoutes from "./routes/copywritingRoutes";
import inboxRoutes from "./routes/inboxRoutes";
import qualificationRoutes from "./routes/qualificationRoutes";
import meetingRoutes from "./routes/meetingRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import integrationRoutes from "./routes/integrationRoutes";
import superadminRoutes from "./routes/superadminRoutes";

import "./services/queue/outreachWorker";

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

// Initialize Prisma
export const prisma = new PrismaClient();

// Middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// Logger Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Register routers
app.use("/api/icp", icpRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/emails", emailRoutes);
app.use("/api/sequences", sequenceRoutes);
app.use("/api/copywriter", copywritingRoutes);
app.use("/api/inbox", inboxRoutes);
app.use("/api/qualifications", qualificationRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/integrations", integrationRoutes);
app.use("/api/superadmin", superadminRoutes);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK", timestamp: new Date().toISOString() });
});

// Test DB Connection
app.get("/api/db-test", async (req: Request, res: Response) => {
  try {
    const userCount = await prisma.user.count();
    res.status(200).json({
      success: true,
      message: "Successfully connected to PostgreSQL database!",
      stats: { userCount },
    });
  } catch (error: any) {
    console.error("Database connection test failed:", error);
    res.status(500).json({
      success: false,
      error: "Database connection failed",
      details: error.message,
    });
  }
});

// Basic Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: "Internal Server Error",
    message: err.message,
  });
});

// Start Server
app.listen(port, () => {
  console.log(`🚀 Express API server running on http://localhost:${port}`);
});
