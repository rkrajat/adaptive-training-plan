import { z } from 'zod';

import { TIME_MAXIMUMS, TIME_MINIMUMS } from './race-goal.constants';
import type { RaceDistance } from './race-goal.types';

/**
 * Valid race distances as Zod enum values
 */
export const raceDistanceSchema = z.union([
  z.literal(5000),
  z.literal(10000),
  z.literal(21097.5),
  z.literal(42195),
]);

/**
 * Race goal input validation schema
 * Validates distance and target time with world record minimums
 */
export const raceGoalInputSchema = z
  .object({
    distance: raceDistanceSchema,
    targetTimeSeconds: z.number().positive('Target time must be positive'),
  })
  .refine(
    (data) => {
      const minTime = TIME_MINIMUMS[data.distance as RaceDistance];
      return data.targetTimeSeconds >= minTime;
    },
    {
      message: 'Target time is below world record minimum',
      path: ['targetTimeSeconds'],
    }
  )
  .refine(
    (data) => {
      const maxTime = TIME_MAXIMUMS[data.distance as RaceDistance];
      return data.targetTimeSeconds <= maxTime;
    },
    {
      message: 'Target time exceeds maximum allowed',
      path: ['targetTimeSeconds'],
    }
  );

/**
 * Type for race goal input request
 */
export type RaceGoalInput = z.infer<typeof raceGoalInputSchema>;

/**
 * Update race goal request schema
 */
export const updateRaceGoalSchema = z.object({
  raceGoal: raceGoalInputSchema,
});

export type UpdateRaceGoalRequest = z.infer<typeof updateRaceGoalSchema>;
