import jwt from "jsonwebtoken";

import { config } from "../config";
import { User } from "../models/User";
import type { JwtPayload, UserProfileResponse } from "../types/api.types";
import type { StravaTokenResponse } from "../types/strava.types";
import { UnauthorizedError, InternalServerError } from "../utils/error";
import { log } from "../utils/logger";

/**
 * Auth Service
 * Handles authentication, JWT operations, and user management
 */
export class AuthService {
  /**
   * Create or update user from Strava OAuth response
   */
  async upsertUserFromStrava(tokenResponse: StravaTokenResponse): Promise<{
    userId: string;
    user: {
      stravaId: number;
      firstName: string;
      lastName: string;
      profilePhoto: string;
      stravaAccessToken: string;
      stravaRefreshToken: string;
      stravaTokenExpiresAt: Date;
    };
  }> {
    try {
      const { athlete, access_token, refresh_token, expires_at } = tokenResponse;

      log.info("Creating or updating user from Strava data", {
        stravaId: athlete.id,
      });

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

      log.info("User created or updated successfully", {
        userId: user._id,
        stravaId: athlete.id,
      });

      return {
        userId: String(user._id),
        user: {
          stravaId: user.stravaId,
          firstName: user.firstName,
          lastName: user.lastName,
          profilePhoto: user.profilePhoto,
          stravaAccessToken: user.stravaAccessToken!,
          stravaRefreshToken: user.stravaRefreshToken!,
          stravaTokenExpiresAt: user.stravaTokenExpiresAt!,
        },
      };
    } catch (error) {
      log.error("Failed to create or update user", error);
      throw new InternalServerError("Failed to create or update user", error);
    }
  }

  /**
   * Update user's Strava tokens
   */
  async updateUserTokens(
    userId: string,
    accessToken: string,
    refreshToken: string,
    expiresAt: number
  ): Promise<void> {
    try {
      log.info("Updating user tokens", { userId });

      await User.findByIdAndUpdate(userId, {
        stravaAccessToken: accessToken,
        stravaRefreshToken: refreshToken,
        stravaTokenExpiresAt: new Date(expiresAt * 1000),
      });

      log.info("User tokens updated successfully", { userId });
    } catch (error) {
      log.error("Failed to update user tokens", error, { userId });
      throw new InternalServerError("Failed to update user tokens", error);
    }
  }

  /**
   * Get user profile by user ID
   */
  async getUserProfile(userId: string): Promise<UserProfileResponse> {
    try {
      log.info("Fetching user profile", { userId });

      const user = await User.findById(userId);

      if (!user) {
        log.warn("User not found", { userId });
        throw new UnauthorizedError("User not found");
      }

      return {
        id: String(user._id),
        stravaId: user.stravaId,
        firstName: user.firstName,
        lastName: user.lastName,
        profilePhoto: user.profilePhoto,
      };
    } catch (error) {
      if (error instanceof UnauthorizedError) {
        throw error;
      }
      log.error("Failed to fetch user profile", error, { userId });
      throw new InternalServerError("Failed to fetch user profile", error);
    }
  }

  /**
   * Generate JWT token for authenticated user
   */
  generateJwtToken(payload: JwtPayload): string {
    try {
      log.info("Generating JWT token", { userId: payload.userId });

      const token = jwt.sign({ ...payload }, config.jwt.secret, { expiresIn: "24h" });

      return token;
    } catch (error) {
      log.error("Failed to generate JWT token", error);
      throw new InternalServerError("Failed to generate authentication token");
    }
  }

  /**
   * Verify and decode JWT token
   */
  verifyJwtToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        log.warn("JWT token expired");
        throw new UnauthorizedError("Authentication token expired");
      }
      if (error instanceof jwt.JsonWebTokenError) {
        log.warn("Invalid JWT token");
        throw new UnauthorizedError("Invalid authentication token");
      }
      log.error("Failed to verify JWT token", error);
      throw new UnauthorizedError("Authentication failed");
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
