/**
 * Base application error class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode = 500,
    isOperational = true,
    details?: unknown
  ) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;

    Error.captureStackTrace(this);
  }
}

/**
 * 400 Bad Request error
 */
export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, true, details);
  }
}

/**
 * 401 Unauthorized error
 */
export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401, true);
  }
}

/**
 * 403 Forbidden error
 */
export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403, true);
  }
}

/**
 * 404 Not Found error
 */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, true);
  }
}

/**
 * 409 Conflict error
 */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, true);
  }
}

/**
 * 500 Internal Server error
 */
export class InternalServerError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 500, false, details);
  }
}

/**
 * Strava API specific error
 */
export class StravaApiError extends AppError {
  constructor(message: string, statusCode: number, details?: unknown) {
    super(message, statusCode, true, details);
  }
}

/**
 * Token expiration error
 */
export class TokenExpiredError extends UnauthorizedError {
  constructor(message = "Token expired") {
    super(message);
  }
}
