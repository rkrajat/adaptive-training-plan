/**
 * Strava API Types
 * Based on the Strava API v3 documentation
 */

export interface StravaAthlete {
  id: number;
  firstname: string;
  lastname: string;
  profile: string;
  profile_medium?: string;
  city?: string;
  state?: string;
  country?: string;
  sex?: string;
  premium?: boolean;
  summit?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface StravaActivity {
  id: number;
  name: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  sport_type?: string;
  start_date: string;
  start_date_local: string;
  timezone: string;
  utc_offset?: number;
  achievement_count?: number;
  kudos_count?: number;
  comment_count?: number;
  athlete_count?: number;
  photo_count?: number;
  trainer?: boolean;
  commute?: boolean;
  manual?: boolean;
  private?: boolean;
  flagged?: boolean;
  gear_id?: string | null;
  average_speed?: number;
  max_speed?: number;
  average_cadence?: number;
  average_temp?: number;
  average_watts?: number;
  max_watts?: number;
  weighted_average_watts?: number;
  kilojoules?: number;
  device_watts?: boolean;
  has_heartrate?: boolean;
  average_heartrate?: number | null;
  max_heartrate?: number;
  heartrate_opt_out?: boolean;
  display_hide_heartrate_option?: boolean;
  elev_high?: number;
  elev_low?: number;
  pr_count?: number;
  total_photo_count?: number;
  has_kudoed?: boolean;
  workout_type?: number | null;
  suffer_score?: number | null;
  description?: string;
  calories?: number;
  perceived_exertion?: number | null;
}

export interface StravaTokenResponse {
  token_type: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
  access_token: string;
  athlete: StravaAthlete;
}

export interface StravaRefreshTokenResponse {
  token_type: string;
  access_token: string;
  expires_at: number;
  expires_in: number;
  refresh_token: string;
}

export interface StravaErrorResponse {
  message: string;
  errors?: Array<{
    resource: string;
    field: string;
    code: string;
  }>;
}

/**
 * Formatted activity for API responses
 */
export interface FormattedActivity {
  id: number;
  name: string;
  distance: number;
  movingTime: number;
  type: string;
  startDate: string;
  averageHeartrate: number | null;
}

/**
 * Type guard to check if error is a Strava API error with statusCode
 */
export const isStravaApiError = (
  error: unknown
): error is { statusCode: number; message: string } => {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    typeof (error as { statusCode: unknown }).statusCode === "number"
  );
};
