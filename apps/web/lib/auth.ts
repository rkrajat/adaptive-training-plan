import { api } from "./api";

const SESSION_COOKIE_NAME = "session_active";

// Read session_active cookie (instant, no API call)
const getSessionCookie = (): boolean => {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((cookie) => cookie.startsWith(`${SESSION_COOKIE_NAME}=`));
};

// Clear session cookie on client side (for immediate UI update)
const clearSessionCookie = (): void => {
  if (typeof document === "undefined") return;
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0`;
};

export const isAuthenticated = (): boolean => {
  return getSessionCookie();
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

// DEPRECATED - kept for migration period
export const getToken = (): string | null => null;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const setToken = (_token: string): void => {};
export const removeToken = (): void => {
  clearSessionCookie();
};
