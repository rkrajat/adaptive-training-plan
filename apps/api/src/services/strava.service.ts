import strava from "strava-v3";

import { config } from "../config";
import type {
  StravaActivity,
  StravaRefreshTokenResponse,
  FormattedActivity,
  StravaTokenResponse,
} from "../types/strava.types";
import { StravaApiError, UnauthorizedError } from "../utils/error";
import { log } from "../utils/logger";
import { getMockActivities } from "../utils/mock";

/**
 * Strava Service
 * Handles all interactions with the Strava API
 */
export class StravaService {
  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<StravaTokenResponse> {
    try {
      log.info("Exchanging authorization code for access token");

      const response = await strava.oauth.getToken(code);

      log.info("Successfully obtained Strava access token", {
        athleteId: response.athlete.id,
        expiresAt: response.expires_at,
      });

      return response as StravaTokenResponse;
    } catch (error) {
      log.error("Failed to exchange authorization code for token", error);
      throw new StravaApiError(
        "Failed to authenticate with Strava",
        500,
        error
      );
    }
  }

  /**
   * Refresh an expired access token
   */
  async refreshAccessToken(refreshToken: string): Promise<StravaRefreshTokenResponse> {
    try {
      log.info("Refreshing Strava access token");

      const response = await strava.oauth.refreshToken(refreshToken);

      log.info("Successfully refreshed Strava access token", {
        expiresAt: response.expires_at,
      });

      return response as StravaRefreshTokenResponse;
    } catch (error) {
      log.error("Failed to refresh Strava access token", error);
      throw new UnauthorizedError("Failed to refresh Strava access token");
    }
  }

  /**
   * Check if token is expired and refresh if necessary
   * Returns updated token info if refreshed, null otherwise
   */
  async checkAndRefreshToken(
    _accessToken: string,
    refreshToken: string,
    expiresAt: number
  ): Promise<StravaRefreshTokenResponse | null> {
    const now = Math.floor(Date.now() / 1000);
    const bufferTime = 300; // 5 minutes buffer

    if (expiresAt - now < bufferTime) {
      log.info("Strava token is expired or about to expire, refreshing");
      return await this.refreshAccessToken(refreshToken);
    }

    return null;
  }

  /**
   * Fetch activities from Strava API for the last N days
   */
  async fetchActivities(
    accessToken: string,
    lookbackDays: number = config.activities.lookbackDays
  ): Promise<StravaActivity[]> {
    try {
      const afterTimestamp = Math.floor(Date.now() / 1000) - lookbackDays * 24 * 60 * 60;

      log.info("Fetching activities from Strava", {
        lookbackDays,
        afterTimestamp,
      });

      const activities = await strava.athlete.listActivities({
        access_token: accessToken,
        after: afterTimestamp,
        per_page: config.activities.perPage,
      });

      log.info("Successfully fetched activities from Strava", {
        count: activities.length,
      });

      return activities as StravaActivity[];
    } catch (error) {
      // Type guard to check if it's a Strava API error with statusCode
      if (
        typeof error === "object" &&
        error !== null &&
        "statusCode" in error &&
        (error as { statusCode: number }).statusCode === 401
      ) {
        log.warn("Strava access token expired or invalid");
        throw new UnauthorizedError("Strava access token expired or invalid");
      }

      log.error("Failed to fetch activities from Strava", error);
      throw new StravaApiError("Failed to fetch activities from Strava", 500, error);
    }
  }

  /**
   * Format raw Strava activities for API response
   * Converts snake_case to camelCase and filters relevant fields
   */
  formatActivities(activities: StravaActivity[]): FormattedActivity[] {
    return activities
      .map((activity) => ({
        id: activity.id,
        name: activity.name,
        distance: activity.distance,
        movingTime: activity.moving_time,
        type: activity.type,
        startDate: activity.start_date,
        averageHeartrate: activity.average_heartrate ?? null,
      }))
      .sort((activityA, activityB) =>
        new Date(activityB.startDate).getTime() - new Date(activityA.startDate).getTime()
      );
  }

  /**
   * Get activities with automatic mock fallback
   * Returns mock data if USE_MOCK_DATA env var is set
   */
  async getActivitiesWithMockFallback(
    accessToken: string,
    useMock = false
  ): Promise<FormattedActivity[]> {
    if (useMock) {
      log.info("Using mock Strava activities data");
      const mockActivities = getMockActivities();
      return this.formatActivities(mockActivities as StravaActivity[]);
    }

    const activities = await this.fetchActivities(accessToken);
    return this.formatActivities(activities);
  }

  /**
   * Build Strava OAuth authorization URL
   */
  getAuthorizationUrl(): string {
    return `https://www.strava.com/oauth/authorize?client_id=${config.strava.clientId}&response_type=code&redirect_uri=${config.strava.redirectUri}&approval_prompt=auto&scope=read,activity:read_all`;
  }
}

// Export singleton instance
export const stravaService = new StravaService();
