import type { Response } from "express";

import { config } from "../config";

export const AUTH_COOKIE_NAME = "auth_token";
export const SESSION_COOKIE_NAME = "session_active";

const isProduction = config.nodeEnv === "production";

// HttpOnly cookie options for JWT (not accessible to JavaScript)
export const getAuthCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
});

// Regular cookie options for session hint (readable by JavaScript)
export const getSessionCookieOptions = () => ({
  httpOnly: false, // JavaScript can read this
  secure: isProduction,
  sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
});

export const setAuthCookies = (res: Response, token: string): void => {
  // Set HttpOnly JWT cookie
  res.cookie(AUTH_COOKIE_NAME, token, getAuthCookieOptions());
  // Set readable session hint cookie
  res.cookie(SESSION_COOKIE_NAME, "1", getSessionCookieOptions());
};

export const clearAuthCookies = (res: Response): void => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    path: "/",
  });
  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: false,
    secure: isProduction,
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    path: "/",
  });
};
