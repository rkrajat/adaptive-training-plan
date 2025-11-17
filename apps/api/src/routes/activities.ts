import { Router, type Request, type Response } from "express";

import { authenticateJWT } from "../middleware/auth";
import { stravaService } from "../services/strava.service";
import { UnauthorizedError } from "../utils/error";
import { log } from "../utils/logger";
import { useMockData } from "../utils/mock";
import { sendSuccess, sendUnauthorized, sendInternalError } from "../utils/response";

const router = Router();

// GET /api/activities - Fetch activities from Strava (last 30 days)
router.get("/", authenticateJWT, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      sendUnauthorized(res, "User not authenticated");
      return;
    }

    const { stravaAccessToken } = req.user;

    // Fetch and format activities (with mock fallback if enabled)
    const formattedActivities = await stravaService.getActivitiesWithMockFallback(
      stravaAccessToken,
      useMockData()
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

export { router as activitiesRouter };
