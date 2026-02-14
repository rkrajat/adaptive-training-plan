/**
 * Module-level storage for telemetry user context.
 * Extracts user info from JWT token for trace attribution.
 */

interface TelemetryUser {
  userId: string;
  stravaId: number;
}

let currentUser: TelemetryUser | null = null;

/**
 * Decode JWT payload (base64) without verification.
 * Token is already validated by the backend on API calls.
 */
const decodeJwtPayload = (token: string): TelemetryUser | null => {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload));
    if (decoded.userId && decoded.stravaId) {
      return { userId: decoded.userId, stravaId: decoded.stravaId };
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Set telemetry user from JWT token.
 * Call this after authentication.
 */
export const setTelemetryUser = (token: string | null): void => {
  currentUser = token ? decodeJwtPayload(token) : null;
};

/**
 * Clear telemetry user context (on logout).
 */
export const clearTelemetryUser = (): void => {
  currentUser = null;
};

/**
 * Get current user attributes for spans.
 */
export const getTelemetryUserAttributes = (): Record<
  string,
  string | number
> | null => {
  if (!currentUser) return null;
  return {
    "user.id": currentUser.userId,
    "user.strava_id": currentUser.stravaId,
  };
};
