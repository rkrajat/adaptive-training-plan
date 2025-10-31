import type { FormattedActivity } from "./strava.types";

/**
 * JWT Payload structure
 */
export interface JwtPayload {
  userId: string;
  stravaId: number;
  stravaAccessToken: string;
  stravaRefreshToken: string;
  stravaTokenExpiresAt: number;
}

/**
 * Extended Request user object (added by auth middleware)
 */
export interface RequestUser {
  userId: string;
  stravaId: number;
  stravaAccessToken: string;
  stravaRefreshToken: string;
  stravaTokenExpiresAt: number;
}

/**
 * User profile response
 */
export interface UserProfileResponse {
  id: string;
  stravaId: number;
  firstName: string;
  lastName: string;
  profilePhoto: string;
}

/**
 * Activities response
 */
export interface ActivitiesResponse {
  activities: FormattedActivity[];
}

/**
 * Recommendations request body
 */
export interface RecommendationsRequestBody {
  currentWeekPlan: string;
  userFeedback?: string;
}

/**
 * Recommendations response
 */
export interface RecommendationsResponse {
  recommendations: string;
}

/**
 * Health check response
 */
export interface HealthCheckResponse {
  status: string;
  message: string;
}

/**
 * Error response
 */
export interface ErrorResponse {
  error: string;
  details?: unknown;
}

/**
 * OAuth callback query parameters
 */
export interface OAuthCallbackQuery {
  code?: string;
  scope?: string;
  error?: string;
}
