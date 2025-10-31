import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import "dotenv/config";

import { activitiesRouter } from "./routes/activities";
import { authRouter } from "./routes/auth";
import { recommendationsRouter } from "./routes/recommendations";

const app = express();
const PORT = process.env.PORT || 4000;

// CORS configuration to allow credentials
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use("/api/auth", authRouter);
app.use("/api/activities", activitiesRouter);
app.use("/api/recommendations", recommendationsRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", message: "API is running" });
});

// MongoDB connection
const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error("MONGODB_URI is not set");
    }
    await mongoose.connect(mongoUri);
    console.log("✓ MongoDB connected successfully");
  } catch (error) {
    console.error("✗ MongoDB connection error:", error);
    console.log("⚠️  Server will continue without database connection");
  }
};

// Start server after connecting to MongoDB
const startServer = async (): Promise<void> => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`API server running on http://localhost:${PORT}`);
    console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(
      `Strava Client ID: ${
        process.env.STRAVA_CLIENT_ID ? "✓ Set" : "✗ Missing"
      }`
    );
  });
};

startServer();
