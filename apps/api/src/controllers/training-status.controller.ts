import { getCurrentWeekNumber } from "@adaptive-training-plan/utils";
import type { Request, Response } from "express";

import { TrainingPlan } from "../models/TrainingPlan";
import { User } from "../models/User";
import { aiService } from "../services/ai.service";
import { authService } from "../services/auth.service";
import { stravaService } from "../services/strava.service";
import type { StravaActivity } from "../types/strava.types";
import { formatActivitiesForAI } from "../utils/activity-formatter";
import { log } from "../utils/logger";
import { useMockData } from "../utils/mock";
import {
  sendSuccess,
  sendInternalError,
  sendUnauthorized,
} from "../utils/response";

/**
 * Ineligibility reasons for training status
 */
type IneligibilityReason = "no_active_plan" | "week_one" | "no_recent_activities";

/**
 * Training status eligibility response
 */
interface TrainingStatusIneligibleResponse {
  eligibleForStatus: false;
  reason: IneligibilityReason;
}

/**
 * Training status success response
 */
interface TrainingStatusSuccessResponse {
  status: "on_track" | "slightly_off_track" | "off_track";
  rationale: string;
  currentWeek: number;
}

/**
 * Calculate the start date of a given week number based on the plan start date
 * Week 1 starts on planStartDate, Week 2 starts 7 days later, etc.
 */
const getWeekStartDate = (planStartDate: Date, weekNumber: number): Date => {
  const startDate = new Date(planStartDate);
  startDate.setHours(0, 0, 0, 0); // Normalize to start of day

  // Add (weekNumber - 1) * 7 days to get target week's start
  const targetStart = new Date(startDate);
  targetStart.setDate(startDate.getDate() + (weekNumber - 1) * 7);

  return targetStart;
};

/**
 * Filter activities by week boundaries based on plan start date
 * Includes: previous week (full 7 days) + current week (day 1 through today)
 */
const filterActivitiesByWeekBoundaries = (
  activities: StravaActivity[],
  planStartDate: Date,
  currentWeek: number
): StravaActivity[] => {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today

  // Calculate start of previous week
  const previousWeekStart = getWeekStartDate(planStartDate, currentWeek - 1);

  // Filter: previousWeekStart <= activityDate <= today
  return activities.filter((activity) => {
    const activityDate = new Date(activity.start_date);
    return activityDate >= previousWeekStart && activityDate <= today;
  });
};

/**
 * Get training status for authenticated user
 * POST /api/training-status
 */
export const getTrainingStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      sendUnauthorized(res, "User not authenticated");
      return;
    }

    const {
      userId,
      stravaAccessToken,
      stravaRefreshToken,
      stravaTokenExpiresAt,
    } = req.user;

    // Check if user has an active training plan
    const activePlan = await TrainingPlan.findOne({
      userId,
      isActive: true,
    });

    if (!activePlan) {
      const response: TrainingStatusIneligibleResponse = {
        eligibleForStatus: false,
        reason: "no_active_plan",
      };
      sendSuccess(res, response);
      return;
    }

    // Calculate current week
    const currentWeek = getCurrentWeekNumber(activePlan.startDate);

    // Check if user is in week 1 (not eligible yet)
    if (currentWeek < 2) {
      const response: TrainingStatusIneligibleResponse = {
        eligibleForStatus: false,
        reason: "week_one",
      };
      sendSuccess(res, response);
      return;
    }

    // Check and refresh Strava token if needed
    let accessToken = stravaAccessToken;

    const refreshedTokens = await stravaService.checkAndRefreshToken(
      stravaAccessToken,
      stravaRefreshToken,
      stravaTokenExpiresAt
    );

    if (refreshedTokens) {
      log.info("Strava token was refreshed for training status");
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
      rawActivities = await stravaService.fetchActivities(accessToken, userId);
    }

    // Filter activities by plan-based week boundaries (previous week + current week up to today)
    const recentActivities = filterActivitiesByWeekBoundaries(
      rawActivities,
      activePlan.startDate,
      currentWeek
    );

    // Check if user has any recent activities
    if (recentActivities.length === 0) {
      const response: TrainingStatusIneligibleResponse = {
        eligibleForStatus: false,
        reason: "no_recent_activities",
      };
      sendSuccess(res, response);
      return;
    }

    // Format activities for AI
    const enhancedActivities = formatActivitiesForAI(recentActivities);

    // Get user's experience level
    const user = await User.findById(userId);
    const experienceLevel = user?.experienceLevel || "intermediate";

    // Get start date as string
    const startDate = activePlan.startDate.toISOString().split("T")[0];

    log.info("Generating training status", {
      userId,
      currentWeek,
      activitiesCount: enhancedActivities.length,
      experienceLevel,
    });

    // Generate training status using AI
    const statusResult = await aiService.generateTrainingStatus(
      enhancedActivities,
      activePlan.csvContent,
      startDate,
      experienceLevel,
      currentWeek,
      activePlan.startDate
    );

    const response: TrainingStatusSuccessResponse = {
      status: statusResult.status,
      rationale: statusResult.rationale,
      currentWeek,
    };

    sendSuccess(res, response);
  } catch (error) {
    log.error("Error generating training status", error);
    sendInternalError(res, "Failed to generate training status");
  }
};
