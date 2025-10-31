import { Router, type Request, type Response } from "express";
import { authenticateJWT } from "../middleware/auth";
import { validateBody } from "../middleware/validate";
import { recommendationsGenerateSchema } from "../validators/recommendations.validator";
import { stravaService } from "../services/strava.service";
import { authService } from "../services/auth.service";
import { aiService } from "../services/ai.service";
import { useMockData } from "../utils/mock";
import { log } from "../utils/logger";
import { sendUnauthorized, sendInternalError } from "../utils/response";
import { UnauthorizedError, InternalServerError } from "../utils/error";
import type { StravaActivity } from "../types/strava.types";

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

      const { stravaAccessToken, stravaRefreshToken, stravaTokenExpiresAt } = req.user;

      // Check if token is expired and refresh if needed
      let accessToken = stravaAccessToken;

      const refreshedTokens = await stravaService.checkAndRefreshToken(
        stravaAccessToken,
        stravaRefreshToken,
        stravaTokenExpiresAt
      );

      if (refreshedTokens) {
        log.info("Strava token was refreshed, updating user tokens");
        accessToken = refreshedTokens.access_token;

        // Update user tokens in database
        await authService.updateUserTokens(
          req.user.userId,
          refreshedTokens.access_token,
          refreshedTokens.refresh_token,
          refreshedTokens.expires_at
        );
      }

      // Fetch Strava activities
      let activities: StravaActivity[];

      if (useMockData()) {
        const { getMockActivities } = await import("../utils/mock");
        activities = getMockActivities() as StravaActivity[];
      } else {
        activities = await stravaService.fetchActivities(accessToken);
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
  }
);

export { router as recommendationsRouter };
