import { User } from "../models/User";
import type { StravaActivity } from "../types/strava.types";
import { formatActivitiesForAI } from "../utils/activity-formatter";
import {
  getRecommendationCacheKey,
  recommendationsCache,
} from "../utils/cache";
import { log } from "../utils/logger";
import { useMockData } from "../utils/mock";

import { aiService } from "./ai.service";
import { authService } from "./auth.service";
import { stravaService } from "./strava.service";
import { trainingPlanService } from "./training-plan.service";

interface CachedRecommendationResult {
  content: string;
  cached: boolean;
}

/**
 * Recommendation Generation Service
 * Handles recommendation generation with in-memory caching
 */
export class RecommendationGenerationService {
  /**
   * Generate and cache recommendation for a user/plan/week
   * Returns cached recommendation if available, otherwise generates new one
   */
  async generateAndCacheRecommendation(
    userId: string,
    planId: string,
    weekNumber: number,
    userFeedback?: string
  ): Promise<CachedRecommendationResult> {
    try {
      // Check cache first
      const cacheKey = getRecommendationCacheKey(userId, planId, weekNumber);
      const cached = recommendationsCache.get(cacheKey);

      if (cached) {
        log.info("Recommendation cache hit", { userId, planId, weekNumber });
        return {
          content: cached.content,
          cached: true,
        };
      }

      log.info("Recommendation cache miss, generating new recommendation", {
        userId,
        planId,
        weekNumber,
      });

      // Fetch training plan
      const trainingPlan = await trainingPlanService.getTrainingPlan(
        planId,
        userId
      );

      // Get user's Strava tokens
      const user = await User.findOne({ _id: userId });
      if (!user) {
        throw new Error("User not found");
      }

      const { stravaAccessToken, stravaRefreshToken, stravaTokenExpiresAt } =
        user;

      // Validate Strava tokens exist (required for fetching activities)
      if (!stravaAccessToken || !stravaRefreshToken) {
        throw new Error("User does not have Strava tokens configured");
      }

      // Check if token is expired and refresh if needed
      // Start with the stored access token, update if refreshed
      let accessToken: string = stravaAccessToken;

      // Convert Date to Unix timestamp (seconds) for checkAndRefreshToken
      const expiresAtTimestamp = stravaTokenExpiresAt
        ? Math.floor(stravaTokenExpiresAt.getTime() / 1000)
        : 0;

      const refreshedTokens = await stravaService.checkAndRefreshToken(
        stravaAccessToken,
        stravaRefreshToken,
        expiresAtTimestamp
      );

      if (refreshedTokens) {
        log.info("Strava token was refreshed, updating user tokens");
        accessToken = refreshedTokens.access_token;

        // Update user tokens in database
        await authService.updateUserTokens(
          userId,
          refreshedTokens.access_token,
          refreshedTokens.refresh_token,
          refreshedTokens.expires_at
        );
      }

      // Fetch Strava activities
      let rawActivities: StravaActivity[];

      if (useMockData()) {
        const { getMockActivities } = await import("../utils/mock");
        rawActivities = getMockActivities() as StravaActivity[];
      } else {
        // accessToken is guaranteed to be defined here (either original or refreshed)
        rawActivities = await stravaService.fetchActivities(
          accessToken,
          userId
        );
      }

      // Format activities with enhanced metadata for AI service
      const enhancedActivities = formatActivitiesForAI(rawActivities);

      // Fetch user's experience level, race goal (training paces), and name
      const experienceLevel = user.experienceLevel;
      const athleteFirstName = user.firstName;

      // Get training paces from user's race goal (VDOT-derived)
      const trainingPaces = user.raceGoal?.paces;

      log.info("Fetched user profile data for recommendations", {
        userId,
        experienceLevel,
        hasTrainingPaces: !!trainingPaces,
        hasFirstName: !!athleteFirstName,
      });

      // Generate recommendations with enhanced training plan data
      const result = aiService.generateRecommendationsWithEnhancedPlan(
        enhancedActivities,
        trainingPlan.csvContent,
        trainingPlan.currentWeek,
        trainingPlan.startDate,
        userFeedback,
        experienceLevel,
        trainingPaces,
        athleteFirstName
      );

      // Accumulate streamed content
      let accumulatedContent = "";
      for await (const part of result.fullStream) {
        if (part.type === "text-delta") {
          accumulatedContent += part.text;
        }
      }

      log.info("Recommendation generation completed", {
        userId,
        planId,
        weekNumber,
        contentLength: accumulatedContent.length,
      });

      // Store in cache (NOT in DB)
      recommendationsCache.set(cacheKey, {
        content: accumulatedContent,
        cachedAt: Date.now(),
        userId,
        planId,
        weekNumber,
      });

      log.info("Recommendation cached", { userId, planId, weekNumber });

      return {
        content: accumulatedContent,
        cached: false,
      };
    } catch (error) {
      // Log error but don't throw - graceful degradation
      log.error("Failed to generate and cache recommendation", error, {
        userId,
        planId,
        weekNumber,
      });
      throw error;
    }
  }

  /**
   * Get cached recommendation if available
   * Returns null if not cached
   */
  getCachedRecommendation(
    userId: string,
    planId: string,
    weekNumber: number
  ): string | null {
    const cacheKey = getRecommendationCacheKey(userId, planId, weekNumber);
    const cached = recommendationsCache.get(cacheKey);
    return cached ? cached.content : null;
  }
}

// Export singleton instance
export const recommendationGenerationService =
  new RecommendationGenerationService();
