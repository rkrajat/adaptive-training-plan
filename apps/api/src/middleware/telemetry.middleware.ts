import { trace } from "@opentelemetry/api";
import type { NextFunction, Request, Response } from "express";

/**
 * Middleware to add user context and route information to OpenTelemetry spans.
 *
 * This middleware should be applied after the authenticateJWT middleware
 * so that req.user is populated when available.
 */
export const addTelemetryContext = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const span = trace.getActiveSpan();

  if (span) {
    // Add user context if authenticated
    if (req.user?.userId) {
      span.setAttribute("user.id", req.user.userId);
      span.setAttribute("user.strava_id", req.user.stravaId);
    }

    // Add route information for better grouping
    // req.route is populated after the route is matched
    if (req.route?.path) {
      span.setAttribute("http.route", req.route.path);
    }

    // Add useful request metadata
    span.setAttribute("http.method", req.method);
    span.setAttribute("http.target", req.originalUrl);
  }

  next();
};
