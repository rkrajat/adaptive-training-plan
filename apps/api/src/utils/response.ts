import type { Response } from "express";

/**
 * Send a successful JSON response
 * Maintains backward compatibility with existing response formats
 */
export const sendSuccess = <T>(res: Response, data: T, statusCode = 200): void => {
  res.status(statusCode).json(data);
};

/**
 * Send an error JSON response
 * Maintains backward compatibility with existing error response formats
 */
export const sendError = (
  res: Response,
  error: string,
  statusCode = 500,
  details?: unknown
): void => {
  const response: { error: string; details?: unknown } = { error };
  if (details !== undefined) {
    response.details = details;
  }
  res.status(statusCode).json(response);
};

/**
 * Send a 400 Bad Request error
 */
export const sendBadRequest = (res: Response, error: string, details?: unknown): void => {
  sendError(res, error, 400, details);
};

/**
 * Send a 401 Unauthorized error
 */
export const sendUnauthorized = (res: Response, error: string): void => {
  sendError(res, error, 401);
};

/**
 * Send a 404 Not Found error
 */
export const sendNotFound = (res: Response, error: string): void => {
  sendError(res, error, 404);
};

/**
 * Send a 500 Internal Server error
 */
export const sendInternalError = (res: Response, error: string, details?: unknown): void => {
  sendError(res, error, 500, details);
};

/**
 * Send a 201 Created response
 */
export const sendCreated = <T>(res: Response, data: T, message?: string): void => {
  const response = message ? { data, message } : data;
  res.status(201).json(response);
};
