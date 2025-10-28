import { Router, type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import * as strava from "strava-v3";

import { authenticateJWT } from "../middleware/auth";
import { User } from "../models/User";

const router = Router();

// GET /api/auth/strava - Initiates Strava OAuth flow
router.get("/strava", (_req: Request, res: Response) => {
  const clientId = process.env.STRAVA_CLIENT_ID;
  const redirectUri = process.env.STRAVA_REDIRECT_URI;

  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&response_type=code&redirect_uri=${redirectUri}&approval_prompt=force&scope=read,activity:read_all`;

  res.redirect(authUrl);
});

// GET /api/auth/strava/callback - Handles OAuth callback from Strava
router.get("/strava/callback", async (req: Request, res: Response) => {
  const { code, error } = req.query;

  if (error) {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/login?error=${error}`);
    return;
  }

  if (!code || typeof code !== "string") {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/login?error=no_code`);
    return;
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await (strava as any).default.oauth.getToken(code);

    const { access_token, refresh_token, expires_at, athlete } = tokenResponse;

    // Create or update user in MongoDB
    const user = await User.findOneAndUpdate(
      { stravaId: athlete.id },
      {
        stravaId: athlete.id,
        firstName: athlete.firstname,
        lastName: athlete.lastname,
        profilePhoto: athlete.profile,
        stravaAccessToken: access_token,
        stravaRefreshToken: refresh_token,
        stravaTokenExpiresAt: new Date(expires_at * 1000),
      },
      { upsert: true, new: true }
    );

    // Generate JWT token
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      throw new Error("JWT_SECRET is not configured");
    }

    const jwtToken = jwt.sign(
      {
        userId: String(user._id),
        stravaId: user.stravaId,
        stravaAccessToken: access_token,
        stravaRefreshToken: refresh_token,
        stravaTokenExpiresAt: expires_at,
      },
      jwtSecret,
      { expiresIn: "24h" }
    );

    // Redirect to frontend with JWT token
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/auth/callback?token=${jwtToken}`);
  } catch (error) {
    console.error("OAuth callback error:", error);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${frontendUrl}/login?error=auth_failed`);
  }
});

// GET /api/auth/me - Returns authenticated user profile
router.get("/me", authenticateJWT, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ error: "User not authenticated" });
      return;
    }

    const user = await User.findById(req.user.userId);

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user._id,
      stravaId: user.stravaId,
      firstName: user.firstName,
      lastName: user.lastName,
      profilePhoto: user.profilePhoto,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

export { router as authRouter };
