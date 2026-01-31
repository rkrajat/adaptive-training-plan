import type { NextFunction, Request, Response } from "express";

import { authService } from "../services/auth.service";
import type { JwtPayload } from "../types/api.types";
import { AUTH_COOKIE_NAME } from "../utils/cookie";
import { UnauthorizedError } from "../utils/error";
import { log } from "../utils/logger";
import { sendUnauthorized, sendInternalError } from "../utils/response";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const authenticateJWT = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Try cookie first (preferred method)
  let token = req.cookies?.[AUTH_COOKIE_NAME];

  // Fall back to Authorization header for backward compatibility
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      token = authHeader.startsWith("Bearer ")
        ? authHeader.slice(7)
        : authHeader;
    }
  }

  if (!token) {
    sendUnauthorized(res, "Authentication required");
    return;
  }

  try {
    const decoded = authService.verifyJwtToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      sendUnauthorized(res, error.message);
      return;
    }

    log.error("Unexpected error during authentication", error);
    sendInternalError(res, "Authentication failed");
  }
};
