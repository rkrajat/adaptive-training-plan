import { z } from "zod";

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
