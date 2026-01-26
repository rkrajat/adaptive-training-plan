import { Activity } from "../models/Activity";
import { User, type IUser } from "../models/User";
import type {
  ActivitySyncSummary,
  UserSyncResult,
} from "../types/activity.types";
import { log } from "../utils/logger";

import { stravaService } from "./strava.service";

const SYNC_LOOKBACK_DAYS = 30;

/**
 * Activity Sync Service
 * Handles bulk synchronization of Strava activities for all users
 */
export class ActivitySyncService {
  /**
   * Sync activities for all Strava-connected users
   * Processes users sequentially to respect Strava API rate limits
   */
  async syncAllUsers(): Promise<ActivitySyncSummary> {
    const startTime = Date.now();

    log.info("Starting activity sync for all users");

    // Find all users with valid Strava tokens
    const users = await User.find({
      stravaAccessToken: { $exists: true, $ne: null },
      stravaRefreshToken: { $exists: true, $ne: null },
    });

    log.info("Found users with Strava tokens", { count: users.length });

    const summary: ActivitySyncSummary = {
      totalUsers: users.length,
      processedUsers: 0,
      failedUsers: 0,
      activitiesSynced: 0,
      activitiesDeleted: 0,
      failures: [],
      durationMs: 0,
    };

    // Process users sequentially to avoid rate limits
    for (const user of users) {
      const result = await this.syncUserActivities(user);

      if (result.success) {
        summary.processedUsers++;
        summary.activitiesSynced += result.activitiesSynced;
        summary.activitiesDeleted += result.activitiesDeleted;
      } else {
        summary.failedUsers++;
        summary.failures.push({
          userId: result.userId,
          error: result.error || "Unknown error",
        });
      }
    }

    summary.durationMs = Date.now() - startTime;

    log.info("Activity sync completed", {
      totalUsers: summary.totalUsers,
      processedUsers: summary.processedUsers,
      failedUsers: summary.failedUsers,
      activitiesSynced: summary.activitiesSynced,
      activitiesDeleted: summary.activitiesDeleted,
      durationMs: summary.durationMs,
    });

    return summary;
  }

  /**
   * Sync activities for a single user
   */
  private async syncUserActivities(user: IUser): Promise<UserSyncResult> {
    const userId = String(user._id);

    log.info("Syncing activities for user", { userId, stravaId: user.stravaId });

    try {
      // Check and refresh token if needed
      const accessToken = await this.getValidAccessToken(user);

      // Fetch activities from Strava
      const stravaActivities = await stravaService.fetchActivities(
        accessToken,
        SYNC_LOOKBACK_DAYS
      );

      log.info("Fetched activities from Strava", {
        userId,
        count: stravaActivities.length,
      });

      // Upsert activities to database
      const activitiesSynced = await this.upsertActivities(
        userId,
        stravaActivities
      );

      // Delete old activities (older than 30 days)
      const activitiesDeleted = await this.deleteOldActivities(userId);

      // Update user's lastActivitySyncAt
      await User.findByIdAndUpdate(userId, {
        lastActivitySyncAt: new Date(),
      });

      log.info("User activity sync completed", {
        userId,
        activitiesSynced,
        activitiesDeleted,
      });

      return {
        userId,
        success: true,
        activitiesSynced,
        activitiesDeleted,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      log.error("Failed to sync activities for user", error, { userId });

      return {
        userId,
        success: false,
        activitiesSynced: 0,
        activitiesDeleted: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Get a valid access token, refreshing if necessary
   */
  private async getValidAccessToken(user: IUser): Promise<string> {
    const accessToken = user.stravaAccessToken;
    const refreshToken = user.stravaRefreshToken;
    const expiresAt = user.stravaTokenExpiresAt;

    if (!accessToken || !refreshToken || !expiresAt) {
      throw new Error("User does not have valid Strava tokens");
    }

    const expiresAtTimestamp = Math.floor(expiresAt.getTime() / 1000);

    // Check if token needs refresh
    const refreshedTokens = await stravaService.checkAndRefreshToken(
      accessToken,
      refreshToken,
      expiresAtTimestamp
    );

    if (refreshedTokens) {
      // Update user's tokens in database
      await User.findByIdAndUpdate(user._id, {
        stravaAccessToken: refreshedTokens.access_token,
        stravaRefreshToken: refreshedTokens.refresh_token,
        stravaTokenExpiresAt: new Date(refreshedTokens.expires_at * 1000),
      });

      log.info("Refreshed Strava tokens for user", {
        userId: String(user._id),
      });

      return refreshedTokens.access_token;
    }

    return accessToken;
  }

  /**
   * Upsert activities to database using bulk write
   */
  private async upsertActivities(
    userId: string,
    stravaActivities: Array<{
      id: number;
      name: string;
      type: string;
      distance: number;
      moving_time: number;
      start_date: string;
      average_heartrate?: number | null;
    }>
  ): Promise<number> {
    if (stravaActivities.length === 0) {
      return 0;
    }

    const now = new Date();

    const bulkOps = stravaActivities.map((activity) => ({
      updateOne: {
        filter: {
          userId,
          stravaActivityId: activity.id,
        },
        update: {
          $set: {
            userId,
            stravaActivityId: activity.id,
            name: activity.name,
            type: activity.type,
            distance: activity.distance,
            movingTime: activity.moving_time,
            startDate: new Date(activity.start_date),
            averageHeartrate: activity.average_heartrate ?? null,
            syncedAt: now,
          },
        },
        upsert: true,
      },
    }));

    const result = await Activity.bulkWrite(bulkOps);

    const syncedCount = result.upsertedCount + result.modifiedCount;

    log.info("Upserted activities to database", {
      userId,
      upserted: result.upsertedCount,
      modified: result.modifiedCount,
      total: syncedCount,
    });

    return syncedCount;
  }

  /**
   * Delete activities older than 30 days for a user
   */
  private async deleteOldActivities(userId: string): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - SYNC_LOOKBACK_DAYS);

    const result = await Activity.deleteMany({
      userId,
      startDate: { $lt: cutoffDate },
    });

    if (result.deletedCount > 0) {
      log.info("Deleted old activities", {
        userId,
        deletedCount: result.deletedCount,
        cutoffDate: cutoffDate.toISOString(),
      });
    }

    return result.deletedCount;
  }
}

// Export singleton instance
export const activitySyncService = new ActivitySyncService();
