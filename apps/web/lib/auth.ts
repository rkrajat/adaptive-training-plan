import { api } from "./api";

const SESSION_COOKIE_NAME = "session_active";
const SESSION_COOKIE_MAX_AGE = 24 * 60 * 60; // 24 hours in seconds

// Read session_active cookie (instant, no API call)
const getSessionCookie = (): boolean => {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((cookie) => cookie.startsWith(`${SESSION_COOKIE_NAME}=`));
};

// Set session cookie on client side
const setSessionCookie = (): void => {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE_NAME}=1; path=/; max-age=${SESSION_COOKIE_MAX_AGE}; SameSite=Lax`;
};

// Clear session cookie on client side (for immediate UI update)
const clearSessionCookie = (): void => {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0`;
};

export const isAuthenticated = (): boolean => {
  return getSessionCookie();
};

/**
 * Establish session by sending token to backend to set HttpOnly cookie,
 * then set session_active cookie on frontend for instant auth checks.
 */
export const establishSession = async (token: string): Promise<boolean> => {
  try {
    // Call backend to set HttpOnly auth_token cookie
    await api.post("api/auth/session", { json: { token } });
    // Set session_active cookie on frontend for instant auth state checks
    setSessionCookie();
    return true;
  } catch {
    return false;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await api.post("api/auth/logout");
  } catch {
    // Clear client-side even if API fails
  }
  clearSessionCookie();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};
