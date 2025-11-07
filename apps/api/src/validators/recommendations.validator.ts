import { z } from "zod";

/**
 * Recommendations generation request body validation schema
 * Note: This route currently uses a simpler schema
 */
export const recommendationsGenerateSchema = z.object({
  regenerate: z.boolean().optional().default(false),
});

export type RecommendationsGenerateRequest = z.infer<
  typeof recommendationsGenerateSchema
>;

/**
 * Recommendations generation with training plan request body validation schema
 */
export const recommendationsWithPlanSchema = z.object({
  planId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid training plan ID'),
  userFeedback: z.string().max(1000).optional(),
});

export type RecommendationsWithPlanRequest = z.infer<
  typeof recommendationsWithPlanSchema
>;
