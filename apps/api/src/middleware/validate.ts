import type { Request, Response, NextFunction } from "express";
import { type ZodSchema } from "zod";

import { log } from "../utils/logger";
import { sendBadRequest } from "../utils/response";

/**
 * Validation middleware factory
 * Validates request body, query params, or params against a Zod schema
 */
export const validate = (schema: ZodSchema, target: "body" | "query" | "params" = "body") => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const dataToValidate = req[target];

    const result = schema.safeParse(dataToValidate);

    if (!result.success) {
      const errorDetails = result.error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      }));

      log.warn("Validation failed", {
        target,
        path: req.path,
        method: req.method,
        errors: errorDetails,
      });

      sendBadRequest(res, "Invalid request data", errorDetails);
      return;
    }

    // Replace the original data with the parsed/validated data
    // This ensures type safety and applies any transformations/defaults from Zod
    req[target] = result.data;

    next();
  };
};

/**
 * Convenience wrapper for body validation
 */
export const validateBody = (schema: ZodSchema) => validate(schema, "body");

/**
 * Convenience wrapper for query validation
 */
export const validateQuery = (schema: ZodSchema) => validate(schema, "query");

/**
 * Convenience wrapper for params validation
 */
export const validateParams = (schema: ZodSchema) => validate(schema, "params");
