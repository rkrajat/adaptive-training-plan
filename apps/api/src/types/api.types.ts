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

/**
 * Training plan metadata
 */
export interface TrainingPlanMetadata {
  name: string;
  goal?: string;
  raceName?: string;
  raceDate?: string;
  raceDistance?: string;
  targetTime?: string;
}

/**
 * Training plan upload request
 */
export interface TrainingPlanUploadRequest {
  name: string;
  startDate: string;
  goal?: string;
  raceName?: string;
  raceDate?: string;
  raceDistance?: string;
  targetTime?: string;
}

/**
 * Training plan response
 */
export interface TrainingPlanResponse {
  id: string;
  userId: string;
  metadata: TrainingPlanMetadata;
  source: 'user_upload' | 'ai_generated';
  isActive: boolean;
  currentWeek: number;
  startDate: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Training plan with CSV content response
 */
export interface TrainingPlanWithContentResponse extends TrainingPlanResponse {
  csvContent: string;
}

/**
 * Training plan version response
 */
export interface TrainingPlanVersionResponse {
  id: string;
  trainingPlanId: string;
  versionNumber: number;
  metadata: TrainingPlanMetadata;
  changeType: 'created' | 'updated' | 'ai_modified' | 'start_date_updated';
  changeDescription?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Training plan with versions response
 */
export interface TrainingPlanWithVersionsResponse
  extends TrainingPlanWithContentResponse {
  versions: TrainingPlanVersionResponse[];
}

/**
 * List training plans response
 */
export interface ListTrainingPlansResponse {
  plans: (TrainingPlanResponse | TrainingPlanWithContentResponse)[];
}
