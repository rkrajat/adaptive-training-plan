import { z } from "zod";

/**
 * Recommendations generation request body validation schema
 * Note: This route currently uses a simpler schema
 */
export const recommendationsGenerateSchema = z.object({
  regenerate: z.boolean().optional().default(false),
});

export type RecommendationsGenerateRequest = z.infer<typeof recommendationsGenerateSchema>;
