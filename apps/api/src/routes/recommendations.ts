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
import { recommendationAcceptanceService } from "../services/recommendation-acceptance.service";
import { recommendationGenerationService } from "../services/recommendation-generation.service";
import { trainingPlanService } from "../services/training-plan.service";
import {
  getRecommendationCacheKey,
  recommendationsCache,
  invalidateUserRecommendationCache,
} from "../utils/cache";
import {
  UnauthorizedError,
  InternalServerError,
  AppError,
} from "../utils/error";
import { log } from "../utils/logger";
import { sendUnauthorized, sendInternalError } from "../utils/response";
import { rejectRecommendationSchema } from "../validators/recommendation-acceptance.validator";
import { recommendationsWithPlanSchema } from "../validators/recommendations.validator";

const router = Router();

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
      const { userId } = req.user;

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

      // Check cache first
      const cachedContent = recommendationGenerationService.getCachedRecommendation(
        userId,
        planId,
        trainingPlan.currentWeek
      );

      if (cachedContent) {
        log.info("Returning cached recommendation", {
          userId,
          planId,
          weekNumber: trainingPlan.currentWeek,
        });

        // Set headers for streaming (for UX consistency)
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        // Stream cached content (simulate streaming by sending in chunks)
        const chunkSize = 100;
        for (let i = 0; i < cachedContent.length; i += chunkSize) {
          res.write(cachedContent.slice(i, i + chunkSize));
        }

        res.end();
        return;
      }

      // Cache miss - generate new recommendation
      log.info("Cache miss, generating new recommendation", {
        userId,
        planId,
        weekNumber: trainingPlan.currentWeek,
      });

      // Generate and cache recommendation
      const result = await recommendationGenerationService.generateAndCacheRecommendation(
        userId,
        planId,
        trainingPlan.currentWeek,
        userFeedback
      );

      // Set headers for streaming (must be set before any res.write())
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");

      // Stream the generated content
      const chunkSize = 100;
      for (let i = 0; i < result.content.length; i += chunkSize) {
        res.write(result.content.slice(i, i + chunkSize));
      }

      log.info("Streaming recommendations completed successfully");

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

// GET /api/recommendations/pending - Get or generate pending recommendation from cache
router.get("/pending", authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Validate user authentication
    if (!req.user) {
      sendUnauthorized(res, "User not authenticated");
      return;
    }

    const { planId } = req.query;
    const { userId } = req.user;

    if (!planId || typeof planId !== "string") {
      res.status(400).json({ error: "planId query parameter is required" });
      return;
    }

    // Fetch training plan to get current week
    const trainingPlan = await trainingPlanService.getTrainingPlan(
      planId,
      userId
    );

    const weekNumber = trainingPlan.currentWeek;

    log.info("Fetching pending recommendation", {
      userId,
      planId,
      weekNumber,
    });

    // Generate and cache recommendation (or return cached)
    const result = await recommendationGenerationService.generateAndCacheRecommendation(
      userId,
      planId,
      weekNumber
    );

    res.json({
      content: result.content,
      cached: result.cached,
    });
  } catch (error) {
    if (error instanceof AppError) {
      log.warn("Error fetching pending recommendation", {
        error: error.message,
      });
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    log.error("Unexpected error in pending recommendation route", error);
    sendInternalError(res, "Internal server error");
  }
});

// GET /api/recommendations/user/history - Get user's recommendation history
router.get("/user/history", authenticateJWT, getUserRecommendationHistory);

// GET /api/recommendations/active - Get user's active (accepted, non-expired) recommendation
router.get("/active", authenticateJWT, getActiveRecommendation);

// POST /api/recommendations/accept-pending - Accept a cached (pending) recommendation
router.post("/accept-pending", authenticateJWT, async (req: Request, res: Response) => {
  try {
    // Validate user authentication
    if (!req.user) {
      sendUnauthorized(res, "User not authenticated");
      return;
    }

    const { planId } = req.body;
    const { userId } = req.user;

    if (!planId) {
      res.status(400).json({ error: "planId is required" });
      return;
    }

    // Fetch training plan to get current week
    const trainingPlan = await trainingPlanService.getTrainingPlan(
      planId,
      userId
    );

    const weekNumber = trainingPlan.currentWeek;

    // Find cached recommendation
    const cacheKey = getRecommendationCacheKey(userId, planId, weekNumber);
    const cached = recommendationsCache.get(cacheKey);

    if (!cached) {
      res.status(404).json({ error: "No pending recommendation found in cache" });
      return;
    }

    // Create DB record with cached content
    const recommendation = await Recommendation.create({
      userId,
      trainingPlanId: planId,
      weekNumber,
      content: cached.content,
      athleteInputFeedback: null,
      isRegenerated: false,
    });

    log.info("DB record created from cache for acceptance", {
      recommendationId: recommendation._id,
      userId,
      planId,
      weekNumber,
    });

    // Accept the recommendation
    const acceptedRecommendation =
      await recommendationAcceptanceService.acceptRecommendation(
        String(recommendation._id),
        userId
      );

    // Invalidate cache entry after saving to DB
    invalidateUserRecommendationCache(userId, planId, weekNumber);

    res.json({ recommendation: acceptedRecommendation });
  } catch (error) {
    if (error instanceof AppError) {
      log.warn("Error accepting pending recommendation", {
        error: error.message,
      });
      res.status(error.statusCode).json({ error: error.message });
      return;
    }

    log.error("Unexpected error in accept-pending route", error);
    sendInternalError(res, "Internal server error");
  }
});

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
