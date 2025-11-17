import { z } from 'zod';

/**
 * Submit feedback request body validation schema
 */
export const submitFeedbackSchema = z.object({
  recommendationId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid recommendation ID format'),
  usefulnessRating: z
    .number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  wouldFollow: z.boolean({
    invalid_type_error: 'Would follow must be a boolean',
  }),
  comment: z
    .string()
    .max(1000, 'Comment must be at most 1000 characters')
    .trim()
    .optional(),
});

export type SubmitFeedbackRequest = z.infer<typeof submitFeedbackSchema>;

/**
 * Feedback response schema
 */
export const feedbackResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  recommendationId: z.string(),
  usefulnessRating: z.number(),
  wouldFollow: z.boolean(),
  comment: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  message: z.string().optional(),
});

export type FeedbackResponse = z.infer<typeof feedbackResponseSchema>;

/**
 * Feedback status response schema
 */
export const feedbackStatusResponseSchema = z.object({
  hasSubmitted: z.boolean(),
});

export type FeedbackStatusResponse = z.infer<
  typeof feedbackStatusResponseSchema
>;
