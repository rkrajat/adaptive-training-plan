import { clearTelemetryUser } from "@/lib/telemetry";

const TOKEN_KEY = "auth_token";

/**
 * Get the JWT token from localStorage
 */
export const getToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * Store the JWT token in localStorage
 */
export const setToken = (token: string): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * Remove the JWT token from localStorage
 */
export const removeToken = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
};

/**
 * Check if user is authenticated (has a token in localStorage)
 */
export const isAuthenticated = (): boolean => {
  return getToken() !== null;
};

/**
 * Log out the user by removing the token and redirecting to login
 */
export const logout = async (): Promise<void> => {
  clearTelemetryUser();
  removeToken();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
};
