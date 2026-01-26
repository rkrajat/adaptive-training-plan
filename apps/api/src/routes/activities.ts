import { Router, type Request, type Response } from "express";

import { authenticateJWT } from "../middleware/auth";
import { validateQuery } from "../middleware/validate";
import { activitySyncService } from "../services/activity-sync.service";
import { activityService } from "../services/activity.service";
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

// GET /api/activities - Fetch activities from local database (synced from Strava)
router.get("/", authenticateJWT, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      sendUnauthorized(res, "User not authenticated");
      return;
    }

    const { userId, stravaAccessToken } = req.user;

    // Check if using mock data - fall back to Strava API
    if (useMockData()) {
      const formattedActivities =
        await stravaService.getActivitiesWithMockFallback(
          stravaAccessToken,
          true
        );
      sendSuccess(res, { activities: formattedActivities });
      return;
    }

    // Fetch activities from local database
    const activities = await activityService.getActivitiesByUserId(userId);

    // If no activities found, return empty array with helpful message
    if (activities.length === 0) {
      sendSuccess(res, {
        activities: [],
        message: "No activities found. Activities may not have been synced yet.",
      });
      return;
    }

    sendSuccess(res, { activities });
  } catch (error) {
    log.error("Error fetching activities from database", error);
    sendInternalError(res, "Failed to fetch activities");
  }
});

// GET /api/activities/weekly-summary - Get aggregated weekly running statistics
router.get(
  "/weekly-summary",
  authenticateJWT,
  validateQuery(weeklySummaryQuerySchema),
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        sendUnauthorized(res, "User not authenticated");
        return;
      }

      const { startDate, week } = req.query as unknown as WeeklySummaryQuery;
      const { stravaAccessToken } = req.user;

      log.info("Fetching weekly summary", {
        userId: req.user.userId,
        startDate,
        week,
      });

      // Fetch activities from Strava (with mock fallback if enabled)
      const activities = await stravaService.getActivitiesWithMockFallback(
        stravaAccessToken,
        useMockData()
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

// POST /api/activities/sync - Trigger bulk sync of activities for all users
// No authentication required - intended for internal/admin use or scheduled jobs
router.post("/sync", async (_req: Request, res: Response) => {
  try {
    log.info("Activity sync endpoint triggered");

    const summary = await activitySyncService.syncAllUsers();

    sendSuccess(res, summary);
  } catch (error) {
    log.error("Error during activity sync", error);
    sendInternalError(res, "Failed to sync activities");
  }
});

export { router as activitiesRouter };
