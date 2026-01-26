import type { Document, Types } from "mongoose";

/**
 * Activity interface for MongoDB document
 * Represents a synced Strava activity stored locally
 */
export interface IActivity extends Document {
  userId: Types.ObjectId;
  stravaActivityId: number;
  name: string;
  type: string;
  distance: number;
  movingTime: number;
  startDate: Date;
  averageHeartrate: number | null;
  syncedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Activity sync summary returned by the sync endpoint
 */
export interface ActivitySyncSummary {
  totalUsers: number;
  processedUsers: number;
  failedUsers: number;
  activitiesSynced: number;
  activitiesDeleted: number;
  failures: ActivitySyncFailure[];
  durationMs: number;
}

/**
 * Individual user sync failure information
 */
export interface ActivitySyncFailure {
  userId: string;
  error: string;
}

/**
 * Per-user sync result for internal processing
 */
export interface UserSyncResult {
  userId: string;
  success: boolean;
  activitiesSynced: number;
  activitiesDeleted: number;
  error?: string;
}
