import { z } from 'zod';

/**
 * Experience level Zod schema
 */
export const experienceLevelSchema = z.enum(['beginner', 'intermediate', 'advanced']);

/**
 * Update experience level request schema
 */
export const updateExperienceLevelSchema = z.object({
  experienceLevel: experienceLevelSchema,
});

export type UpdateExperienceLevelRequest = z.infer<typeof updateExperienceLevelSchema>;
