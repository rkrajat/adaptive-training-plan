import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import 'dotenv/config';

import { activitiesRouter } from './routes/activities';
import { authRouter } from './routes/auth';

const app = express();
const PORT = process.env.PORT || 4000;

// MongoDB connection
const connectDB = async (): Promise<void> => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/adaptive-training-plan';
    await mongoose.connect(mongoUri);
    console.log('✓ MongoDB connected successfully');
  } catch (error) {
    console.error('✗ MongoDB connection error:', error);
    console.log('⚠️  Server will continue without database connection');
    console.log('   Set up MongoDB Atlas or local MongoDB for full functionality');
  }
};

// Connect to MongoDB
connectDB();

// CORS configuration to allow credentials
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/activities', activitiesRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
  console.log(`Frontend URL: ${process.env.FRONTEND_URL}`);
  console.log(`Strava Client ID: ${process.env.STRAVA_CLIENT_ID ? '✓ Set' : '✗ Missing'}`);
  console.log(`Strava Redirect URI: ${process.env.STRAVA_REDIRECT_URI}`);
});
