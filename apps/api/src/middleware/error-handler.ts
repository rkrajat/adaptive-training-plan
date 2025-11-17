import type { Request, Response, NextFunction } from "express";

import { config } from "../config";
import { AppError } from "../utils/error";
import { log } from "../utils/logger";

/**
 * Global error handling middleware
 * Must be registered AFTER all routes
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Default error values
  let statusCode = 500;
  let message = "Internal server error";
  let details: unknown = undefined;

  // Handle AppError instances (our custom errors)
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;

    // Log operational errors at appropriate level
    if (err.isOperational) {
      log.warn(`Operational error: ${message}`, {
        statusCode,
        path: req.path,
        method: req.method,
        details,
      });
    } else {
      // Non-operational errors are programming errors - log with full stack
      log.error(`Programming error: ${message}`, err, {
        statusCode,
        path: req.path,
        method: req.method,
      });
    }
  } else {
    // Unknown errors - log with full stack trace
    log.error(`Unhandled error: ${err.message}`, err, {
      path: req.path,
      method: req.method,
    });
  }

  // Build response object (maintain backward compatibility)
  const response: { error: string; details?: unknown } = {
    error: message,
  };

  // Include details if they exist
  if (details !== undefined) {
    response.details = details;
  }

  // In development, include stack trace for debugging
  if (config.nodeEnv === "development" && err.stack) {
    response.details = {
      ...(typeof details === "object" && details !== null ? details : {}),
      stack: err.stack,
    };
  }

  res.status(statusCode).json(response);
};

/**
 * Catch-all for 404 Not Found errors
 * Must be registered AFTER all routes but BEFORE error handler
 */
export const notFoundHandler = (req: Request, res: Response): void => {
  log.warn(`Route not found: ${req.method} ${req.path}`);
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.path}`,
  });
};
