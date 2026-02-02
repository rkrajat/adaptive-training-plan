import { Router, type Request, type Response } from "express";

import { config } from "../config";
import { authenticateJWT } from "../middleware/auth";
import { authService } from "../services/auth.service";
import { stravaService } from "../services/strava.service";
import { log } from "../utils/logger";
import { sendSuccess, sendUnauthorized, sendInternalError } from "../utils/response";

const router = Router();

// GET /api/auth/strava - Initiates Strava OAuth flow
router.get("/strava", (_req: Request, res: Response) => {
  const authUrl = stravaService.getAuthorizationUrl();
  res.redirect(authUrl);
});

// GET /api/auth/strava/callback - Handles OAuth callback from Strava
router.get("/strava/callback", async (req: Request, res: Response) => {
  const { code, error } = req.query;

  if (error) {
    log.warn("OAuth callback received error", { error });
    res.redirect(`${config.frontendUrl}/login?error=${error}`);
    return;
  }

  if (!code || typeof code !== "string") {
    log.warn("OAuth callback missing authorization code");
    res.redirect(`${config.frontendUrl}/login?error=no_code`);
    return;
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await stravaService.exchangeCodeForToken(code);

    // Create or update user in MongoDB
    const { userId, user } = await authService.upsertUserFromStrava(tokenResponse);

    // Generate JWT token
    const jwtToken = authService.generateJwtToken({
      userId,
      stravaId: user.stravaId,
      stravaAccessToken: user.stravaAccessToken,
      stravaRefreshToken: user.stravaRefreshToken,
      stravaTokenExpiresAt: Math.floor(user.stravaTokenExpiresAt.getTime() / 1000),
    });

    // Redirect to frontend with token in URL
    // Frontend will store token in localStorage
    res.redirect(`${config.frontendUrl}/auth/callback?token=${jwtToken}`);
  } catch (error) {
    log.error("OAuth callback error", error);
    res.redirect(`${config.frontendUrl}/login?error=auth_failed`);
  }
});

// GET /api/auth/me - Returns authenticated user profile
router.get("/me", authenticateJWT, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      sendUnauthorized(res, "User not authenticated");
      return;
    }

    const userProfile = await authService.getUserProfile(req.user.userId);
    sendSuccess(res, userProfile);
  } catch (error) {
    log.error("Error fetching user profile", error);
    sendInternalError(res, "Failed to fetch user profile");
  }
});

export { router as authRouter };
