import { raceGoalInputSchema } from '@adaptive-training-plan/types';
import { z } from 'zod';

import { TrainingPlanRowSchema } from '../schemas/training-plan-row.schema';

/**
 * Race goal from FormData (fields sent as strings)
 * Transforms string values to numbers for validation
 */
const raceGoalFormDataSchema = z.object({
  distance: z.union([z.number(), z.string().transform(Number)]),
  targetTimeSeconds: z.union([z.number(), z.string().transform(Number)]),
}).transform((data) => ({
  distance: data.distance,
  targetTimeSeconds: data.targetTimeSeconds,
})).pipe(raceGoalInputSchema);

/**
 * Training plan upload metadata validation schema
 * Now includes mandatory race goal for VDOT calculation
 * Supports FormData nested object notation (raceGoal[distance], raceGoal[targetTimeSeconds])
 */
export const trainingPlanUploadSchema = z
  .object({
    name: z.string().min(1, 'Training plan name is required').max(200),
    startDate: z
      .string()
      .min(1, 'Start date is required')
      .refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid date format',
      }),
    goal: z.string().max(500).optional(),
    raceName: z.string().max(200).optional(),
    raceDate: z
      .string()
      .refine((date) => !isNaN(Date.parse(date)), {
        message: 'Invalid date format',
      })
      .optional(),
    raceDistance: z.string().max(50).optional(),
    targetTime: z.string().max(50).optional(),
    // Support both direct object and FormData nested notation
    raceGoal: raceGoalFormDataSchema.optional(),
    'raceGoal[distance]': z.string().optional(),
    'raceGoal[targetTimeSeconds]': z.string().optional(),
  })
  .transform((data) => {
    // If raceGoal is already an object, use it directly
    if (data.raceGoal) {
      return {
        ...data,
        'raceGoal[distance]': undefined,
        'raceGoal[targetTimeSeconds]': undefined,
      };
    }
    // Otherwise, construct from FormData notation
    const distance = data['raceGoal[distance]'];
    const targetTimeSeconds = data['raceGoal[targetTimeSeconds]'];
    if (distance && targetTimeSeconds) {
      return {
        ...data,
        raceGoal: {
          distance: Number(distance),
          targetTimeSeconds: Number(targetTimeSeconds),
        },
        'raceGoal[distance]': undefined,
        'raceGoal[targetTimeSeconds]': undefined,
      };
    }
    return data;
  })
  .refine((data) => data.raceGoal !== undefined, {
    message: 'Race goal is required',
    path: ['raceGoal'],
  });

// The inferred type has raceGoal as optional due to transform, but it's required via refine
// We explicitly type it as required for consumers
export type TrainingPlanUploadRequest = Omit<
  z.infer<typeof trainingPlanUploadSchema>,
  'raceGoal'
> & {
  raceGoal: {
    distance: 5000 | 10000 | 21097.5 | 42195;
    targetTimeSeconds: number;
  };
};

/**
 * Training plan ID param validation schema
 */
export const trainingPlanIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid training plan ID'),
});

export type TrainingPlanIdParam = z.infer<typeof trainingPlanIdParamSchema>;

/**
 * Query parameters for listing training plans
 */
export const listTrainingPlansQuerySchema = z.object({
  isActive: z
    .string()
    .optional()
    .transform((value) => {
      if (value === undefined) return undefined;
      return value === 'true';
    }),
});

export type ListTrainingPlansQuery = z.infer<
  typeof listTrainingPlansQuerySchema
>;

/**
 * Update start date validation schema
 */
export const updateStartDateSchema = z.object({
  startDate: z
    .string()
    .min(1, 'Start date is required')
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format',
    }),
});

export type UpdateStartDateRequest = z.infer<typeof updateStartDateSchema>;

/**
 * Corrected training plan submission schema
 * Used when submitting manually corrected rows from the manual correction UI
 */
export const correctedTrainingPlanSchema = z.object({
  // Metadata for the plan
  name: z.string().min(1, 'Training plan name is required').max(200),
  startDate: z
    .string()
    .min(1, 'Start date is required')
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format',
    }),
  goal: z.string().max(500).optional(),
  raceName: z.string().max(200).optional(),
  raceDate: z
    .string()
    .refine((date) => !isNaN(Date.parse(date)), {
      message: 'Invalid date format',
    })
    .optional(),
  raceGoal: raceGoalInputSchema,
  // The corrected training plan rows
  rows: z.array(TrainingPlanRowSchema).min(1, 'Training plan must have at least one row'),
});

export type CorrectedTrainingPlanRequest = z.infer<typeof correctedTrainingPlanSchema>;
