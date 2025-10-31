import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import "dotenv/config";

import { config } from "./config";
import { log } from "./utils/logger";
import { apiRateLimiter, authRateLimiter } from "./middleware/rate-limit";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { activitiesRouter } from "./routes/activities";
import { authRouter } from "./routes/auth";
import { recommendationsRouter } from "./routes/recommendations";

const app = express();

// CORS configuration to allow credentials
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
  })
);
app.use(express.json());

// Apply rate limiting to all routes
app.use(apiRateLimiter);

// Routes
// Apply stricter rate limiting to auth routes
app.use("/api/auth", authRateLimiter, authRouter);
app.use("/api/activities", activitiesRouter);
app.use("/api/recommendations", recommendationsRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "API is running" });
});

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Error handler (must be last)
app.use(errorHandler);

// MongoDB connection
const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(config.mongoUri);
    log.info("MongoDB connected successfully");
  } catch (error) {
    log.error("MongoDB connection error", error);
    log.warn("Server will continue without database connection");
  }
};

// Start server after connecting to MongoDB
const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(config.port, () => {
    log.info(`API server running on http://localhost:${config.port}`);
    log.info(`Frontend URL: ${config.frontendUrl}`);
    log.info(`Environment: ${config.nodeEnv}`);
    log.info(`Strava Client ID: ${config.strava.clientId ? "✓ Set" : "✗ Missing"}`);
  });
};

startServer();
