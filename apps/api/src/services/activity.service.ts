import { Activity } from "../models/Activity";
import type { FormattedActivity } from "../types/strava.types";
import { log } from "../utils/logger";

/**
 * Activity Service
 * Handles retrieval of locally stored activities from MongoDB
 */
export class ActivityService {
  /**
   * Get activities for a user from the local database
   * Returns activities formatted to match the existing FormattedActivity interface
   */
  async getActivitiesByUserId(userId: string): Promise<FormattedActivity[]> {
    log.info("Fetching activities from database", { userId });

    const activities = await Activity.find({ userId })
      .sort({ startDate: -1 })
      .lean();

    log.info("Found activities in database", {
      userId,
      count: activities.length,
    });

    // Transform database records to FormattedActivity format
    return activities.map((activity) => ({
      id: activity.stravaActivityId,
      name: activity.name,
      distance: activity.distance,
      movingTime: activity.movingTime,
      type: activity.type,
      startDate: activity.startDate.toISOString(),
      averageHeartrate: activity.averageHeartrate,
    }));
  }

  /**
   * Check if a user has any synced activities
   */
  async hasActivities(userId: string): Promise<boolean> {
    const count = await Activity.countDocuments({ userId });
    return count > 0;
  }
}

// Export singleton instance
export const activityService = new ActivityService();
