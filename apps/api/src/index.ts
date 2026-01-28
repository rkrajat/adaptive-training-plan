import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import "dotenv/config";

import { config } from "./config";
import { errorHandler, notFoundHandler } from "./middleware/error-handler";
import { apiRateLimiter, authRateLimiter } from "./middleware/rate-limit";
import { activitiesRouter } from "./routes/activities";
import { authRouter } from "./routes/auth";
import { feedbackRouter } from "./routes/feedback";
import { recommendationsRouter } from "./routes/recommendations";
import { trainingPlansRouter } from "./routes/training-plans";
import { trainingStatusRouter } from "./routes/training-status";
import { userRouter } from "./routes/user";
import { log } from "./utils/logger";

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
app.use("/api/feedback", feedbackRouter);
app.use("/api/recommendations", recommendationsRouter);
app.use("/api/training-plans", trainingPlansRouter);
app.use("/api/training-status", trainingStatusRouter);
app.use("/api/users", userRouter);

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

  const server = app.listen(config.port, () => {
    log.info(`API server running on http://localhost:${config.port}`);
    log.info(`Frontend URL: ${config.frontendUrl}`);
    log.info(`Environment: ${config.nodeEnv}`);
    log.info(
      `Strava Client ID: ${config.strava.clientId ? "✓ Set" : "✗ Missing"}`
    );
  });

  // Configure server timeouts
  // AI recommendations can take 30-60 seconds, so set generous timeouts
  server.timeout = 120000; // 2 minutes - overall request timeout
  server.keepAliveTimeout = 65000; // 65 seconds - keep-alive timeout (slightly higher than typical load balancer timeout)
  server.headersTimeout = 66000; // 66 seconds - headers timeout (should be higher than keepAliveTimeout)
};

startServer();
