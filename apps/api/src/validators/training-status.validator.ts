import { z } from "zod";

/**
 * Training status types
 */
export const trainingStatusTypeSchema = z.enum([
  "on_track",
  "slightly_off_track",
  "off_track",
]);

export type TrainingStatusType = z.infer<typeof trainingStatusTypeSchema>;

/**
 * Ineligibility reason types
 */
export const ineligibilityReasonSchema = z.enum([
  "no_active_plan",
  "week_one",
  "no_recent_activities",
]);

export type IneligibilityReason = z.infer<typeof ineligibilityReasonSchema>;

/**
 * Training status success response schema
 */
export const trainingStatusSuccessSchema = z.object({
  status: trainingStatusTypeSchema,
  rationale: z.string(),
  currentWeek: z.number().int().positive(),
});

export type TrainingStatusSuccessResponse = z.infer<typeof trainingStatusSuccessSchema>;

/**
 * Training status ineligible response schema
 */
export const trainingStatusIneligibleSchema = z.object({
  eligibleForStatus: z.literal(false),
  reason: ineligibilityReasonSchema,
});

export type TrainingStatusIneligibleResponse = z.infer<typeof trainingStatusIneligibleSchema>;

/**
 * Combined training status response schema
 */
export const trainingStatusResponseSchema = z.union([
  trainingStatusSuccessSchema,
  trainingStatusIneligibleSchema,
]);

export type TrainingStatusResponse = z.infer<typeof trainingStatusResponseSchema>;
