import rateLimit from "express-rate-limit";

import { config } from "../config";
import { log } from "../utils/logger";

/**
 * Rate limiter for API endpoints
 * Protects against abuse and DDoS attacks
 */
export const apiRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    error: "Too many requests from this IP, please try again later.",
  },
  handler: (req, res) => {
    log.warn("Rate limit exceeded", {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      error: "Too many requests from this IP, please try again later.",
    });
  },
});

/**
 * Stricter rate limiter for authentication endpoints
 * Helps prevent brute force attacks
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many authentication attempts, please try again later.",
  },
  handler: (req, res) => {
    log.warn("Auth rate limit exceeded", {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      error: "Too many authentication attempts, please try again later.",
    });
  },
});

/**
 * Rate limiter for feedback submission endpoints
 * Prevents spam and abuse of feedback system
 */
export const feedbackRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // Limit each IP to 10 submissions per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many feedback submissions, please try again later.",
  },
  handler: (req, res) => {
    log.warn("Feedback rate limit exceeded", {
      ip: req.ip,
      path: req.path,
      method: req.method,
    });
    res.status(429).json({
      error: "Too many feedback submissions, please try again later.",
    });
  },
});
