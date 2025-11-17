import { z } from 'zod';

/**
 * Training plan upload metadata validation schema
 */
export const trainingPlanUploadSchema = z.object({
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
});

export type TrainingPlanUploadRequest = z.infer<
  typeof trainingPlanUploadSchema
>;

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
