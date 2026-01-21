import { z } from "zod";

// Re-export shared types for convenience
export type {
  RecommendationStatus,
  RejectAction,
  ActiveRecommendation,
  ActiveRecommendationResponse,
  AcceptRecommendationResponse,
  RejectRecommendationRequest,
  RejectRecommendationResponse,
} from "@adaptive-training-plan/types";

/**
 * Recommendation ID parameter validation schema
 */
export const recommendationIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid recommendation ID format"),
});

export type RecommendationIdParam = z.infer<typeof recommendationIdParamSchema>;

/**
 * Reject recommendation request body validation schema
 */
export const rejectRecommendationSchema = z.object({
  action: z.enum(["generate_new", "discard"], {
    message: "Action must be either 'generate_new' or 'discard'",
  }),
});

/**
 * Active recommendation response schema (for validation)
 */
export const activeRecommendationResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  trainingPlanId: z.string(),
  weekNumber: z.number(),
  content: z.string(),
  status: z.enum(["pending", "accepted", "rejected", "expired"]),
  acceptedAt: z.string().nullable(),
  expiresAt: z.string().nullable(),
  createdAt: z.string(),
});

/**
 * Accept recommendation response schema (for validation)
 */
export const acceptRecommendationResponseSchema =
  activeRecommendationResponseSchema;

/**
 * Reject recommendation response schema (for validation)
 */
export const rejectRecommendationResponseSchema = z.object({
  success: z.boolean(),
  action: z.enum(["generate_new", "discard"]),
});
