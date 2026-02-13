import { Router, type Request, type Response } from "express";

import { authenticateJWT } from "../middleware/auth";
import { addTelemetryContext } from "../middleware/telemetry.middleware";
import { validateQuery } from "../middleware/validate";
import { stravaService } from "../services/strava.service";
import { weeklySummaryService } from "../services/weekly-summary.service";
import { UnauthorizedError } from "../utils/error";
import { log } from "../utils/logger";
import { useMockData } from "../utils/mock";
import {
  sendSuccess,
  sendUnauthorized,
  sendInternalError,
} from "../utils/response";
import {
  weeklySummaryQuerySchema,
  type WeeklySummaryQuery,
} from "../validators/weekly-summary.validator";

const router = Router();

// GET /api/activities - Fetch activities from Strava (last 30 days)
router.get("/", authenticateJWT, addTelemetryContext, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      sendUnauthorized(res, "User not authenticated");
      return;
    }

    const { stravaAccessToken, userId } = req.user;
    const forceRefresh = req.query.refresh === "true";

    // Fetch and format activities (with mock fallback if enabled)
    const formattedActivities =
      await stravaService.getActivitiesWithMockFallback(
        stravaAccessToken,
        useMockData(),
        userId,
        forceRefresh
      );

    sendSuccess(res, { activities: formattedActivities });
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      log.warn("Strava access token expired or invalid");
      sendUnauthorized(res, error.message);
      return;
    }

    log.error("Error fetching activities from Strava", error);
    sendInternalError(res, "Failed to fetch activities");
  }
});

// GET /api/activities/weekly-summary - Get aggregated weekly running statistics
router.get(
  "/weekly-summary",
  authenticateJWT,
  addTelemetryContext,
  validateQuery(weeklySummaryQuerySchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        sendUnauthorized(res, "User not authenticated");
        return;
      }

      const { startDate, week } = req.query as unknown as WeeklySummaryQuery;
      const { stravaAccessToken, userId } = req.user;

      log.info("Fetching weekly summary", {
        userId,
        startDate,
        week,
      });

      // Fetch activities from Strava (with mock fallback if enabled)
      const activities = await stravaService.getActivitiesWithMockFallback(
        stravaAccessToken,
        useMockData(),
        userId
      );

      // Calculate weekly summary
      const summary = weeklySummaryService.calculateWeeklySummary(
        activities,
        startDate,
        week
      );

      sendSuccess(res, summary);
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        log.warn("Strava access token expired or invalid");
        sendUnauthorized(res, error.message);
        return;
      }

      log.error("Error calculating weekly summary", error, {
        startDate: req.query.startDate,
        week: req.query.week,
      });

      sendInternalError(res, "Failed to fetch weekly summary");
    }
  }
);

export { router as activitiesRouter };
