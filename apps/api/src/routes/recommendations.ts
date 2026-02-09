import { Router, type Request, type Response } from "express";

import {
  getRecommendationById,
  getUserRecommendationHistory,
  getActiveRecommendation,
  acceptRecommendation,
  rejectRecommendation,
} from "../controllers/recommendation.controller";
import { authenticateJWT } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { Recommendation } from "../models/Recommendation";
import { User } from "../models/User";
import { aiService } from "../services/ai.service";
import { authService } from "../services/auth.service";
import { stravaService } from "../services/strava.service";
import { trainingPlanService } from "../services/training-plan.service";
import type { StravaActivity } from "../types/strava.types";
import { formatActivitiesForAI } from "../utils/activity-formatter";
import {
  UnauthorizedError,
  InternalServerError,
  AppError,
} from "../utils/error";
import { log } from "../utils/logger";
import { useMockData } from "../utils/mock";
import { sendUnauthorized, sendInternalError } from "../utils/response";
import { rejectRecommendationSchema } from "../validators/recommendation-acceptance.validator";
import {
  recommendationsGenerateSchema,
  recommendationsWithPlanSchema,
} from "../validators/recommendations.validator";

const router = Router();

// POST /api/recommendations/generate - Generate AI training recommendations
router.post(
  "/generate",
  authenticateJWT,
  validateBody(recommendationsGenerateSchema),
  async (req: Request, res: Response) => {
    try {
      // Validate user authentication
      if (!req.user) {
        sendUnauthorized(res, "User not authenticated");
        return;
      }

      const { stravaAccessToken, stravaRefreshToken, stravaTokenExpiresAt } =
        req.user;

      // Check if token is expired and refresh if needed
      let accessToken = stravaAccessToken;

      const refreshedTokens = await stravaService.checkAndRefreshToken(
        stravaAccessToken,
        stravaRefreshToken,
        stravaTokenExpiresAt,
      );

      if (refreshedTokens) {
        log.info("Strava token was refreshed, updating user tokens");
        accessToken = refreshedTokens.access_token;

        // Update user tokens in database
        await authService.updateUserTokens(
          req.user.userId,
          refreshedTokens.access_token,
          refreshedTokens.refresh_token,
          refreshedTokens.expires_at,
        );
      }

      // Fetch Strava activities
      let activities: StravaActivity[];

      if (useMockData()) {
        const { getMockActivities } = await import("../utils/mock");
        activities = getMockActivities() as StravaActivity[];
      } else {
        activities = await stravaService.fetchActivities(accessToken, req.user.userId);
      }

      // Generate streaming response with AI
      const result = aiService.streamRecommendationsFromActivities(activities);

      // Set headers for streaming
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Use fullStream to get all parts including text
      for await (const part of result.fullStream) {
        if (part.type === "text-delta") {
          res.write(part.text);
        }
      }

      res.end();

      log.info("Streaming recommendations completed successfully");
    } catch (error) {
      // If headers not yet sent, send error response
      if (!res.headersSent) {
        if (error instanceof UnauthorizedError) {
          log.warn("Unauthorized access to recommendations");
          sendUnauthorized(res, error.message);
          return;
        }

        if (error instanceof InternalServerError) {
          log.error("Internal server error generating recommendations", error);
          sendInternalError(res, error.message, error.details);
          return;
        }

        log.error("Unexpected error in recommendations route", error);
        sendInternalError(res, "Internal server error");
      } else {
        // If headers already sent (streaming in progress), just log the error
        log.error("Error during streaming recommendations", error);
      }
    }
  },
);

// POST /api/recommendations/generate-with-plan - Generate AI recommendations with training plan from database
router.post(
  "/generate-with-plan",
  authenticateJWT,
  validateBody(recommendationsWithPlanSchema),
  async (req: Request, res: Response) => {
    try {
      // Validate user authentication
      if (!req.user) {
        sendUnauthorized(res, "User not authenticated");
        return;
      }

      const { planId, userFeedback } = req.body;
      const {
        stravaAccessToken,
        stravaRefreshToken,
        stravaTokenExpiresAt,
        userId,
      } = req.user;

      // Fetch training plan from database and verify ownership
      const trainingPlan = await trainingPlanService.getTrainingPlan(
        planId,
        userId,
      );

      log.info("Training plan fetched for recommendations", {
        planId,
        userId,
        currentWeek: trainingPlan.currentWeek,
      });

      // Check if token is expired and refresh if needed
      let accessToken = stravaAccessToken;

      const refreshedTokens = await stravaService.checkAndRefreshToken(
        stravaAccessToken,
        stravaRefreshToken,
        stravaTokenExpiresAt,
      );

      if (refreshedTokens) {
        log.info("Strava token was refreshed, updating user tokens");
        accessToken = refreshedTokens.access_token;

        // Update user tokens in database
        await authService.updateUserTokens(
          userId,
          refreshedTokens.access_token,
          refreshedTokens.refresh_token,
          refreshedTokens.expires_at,
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

      // Format activities with enhanced metadata for AI service
      const enhancedActivities = formatActivitiesForAI(rawActivities);

      // Fetch user's experience level, race goal (training paces), and name
      const user = await User.findOne({ _id: userId });
      const experienceLevel = user?.experienceLevel;
      const athleteFirstName = user?.firstName;

      // Get training paces from user's race goal (VDOT-derived)
      // These are fallback paces when the plan doesn't specify them
      const trainingPaces = user?.raceGoal?.paces;

      log.info("Fetched user profile data for recommendations", {
        userId,
        experienceLevel,
        hasTrainingPaces: !!trainingPaces,
        hasFirstName: !!athleteFirstName,
      });

      // Generate recommendations with enhanced training plan data
      // Training paces from VDOT are included to help the AI provide pace-specific recommendations
      // Athlete's first name is passed for personalized coach's notes
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

      // Set headers for streaming (must be set before any res.write())
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream AI response in real-time while accumulating for database storage
      let accumulatedContent = "";
      for await (const part of result.fullStream) {
        if (part.type === "text-delta") {
          accumulatedContent += part.text;
          res.write(part.text);
        }
      }

      log.info("Streaming recommendations completed successfully");

      // After streaming completes, save recommendation to database
      let recommendationId: string | null = null;
      try {
        const recommendation = await Recommendation.create({
          userId,
          trainingPlanId: planId,
          weekNumber: trainingPlan.currentWeek,
          content: accumulatedContent,
          athleteInputFeedback: userFeedback || null,
          isRegenerated: false,
        });

        recommendationId = String(recommendation._id);

        log.info("Recommendation saved to database", {
          recommendationId: recommendation._id,
          userId,
          trainingPlanId: planId,
          weekNumber: trainingPlan.currentWeek,
        });
      } catch (dbError) {
        // Log error but don't break streaming - graceful degradation
        log.error("Failed to save recommendation to database", {
          error: dbError,
          userId,
          trainingPlanId: planId,
        });
      }

      // Append metadata with recommendation ID at end of stream
      // Format: __META__:recId=${id}
      // Note: Frontend will parse and remove this before displaying
      if (recommendationId) {
        res.write(`__META__:recId=${recommendationId}`);
      }

      res.end();
    } catch (error) {
      if (error instanceof AppError) {
        log.warn("Error generating recommendations with training plan", {
          error: error.message,
        });
        res.status(error.statusCode).json({ error: error.message });
        return;
      }

      if (error instanceof UnauthorizedError) {
        log.warn("Unauthorized access to recommendations");
        sendUnauthorized(res, error.message);
        return;
      }

      if (error instanceof InternalServerError) {
        log.error("Internal server error generating recommendations", error);
        sendInternalError(res, error.message, error.details);
        return;
      }

      log.error("Unexpected error in recommendations with plan route", error);
      sendInternalError(res, "Internal server error");
    }
  },
);

// GET /api/recommendations/user/history - Get user's recommendation history
router.get("/user/history", authenticateJWT, getUserRecommendationHistory);

// GET /api/recommendations/active - Get user's active (accepted, non-expired) recommendation
router.get("/active", authenticateJWT, getActiveRecommendation);

// POST /api/recommendations/:id/accept - Accept a recommendation
router.post("/:id/accept", authenticateJWT, acceptRecommendation);

// POST /api/recommendations/:id/reject - Reject a recommendation with action
router.post(
  "/:id/reject",
  authenticateJWT,
  validateBody(rejectRecommendationSchema),
  rejectRecommendation
);

// GET /api/recommendations/:id - Get single recommendation by ID
router.get("/:id", authenticateJWT, getRecommendationById);

export { router as recommendationsRouter };
