import type { RaceDistance, RaceDistanceLabel } from './race-goal.types';

/**
 * Valid race distances in meters
 */
export const RACE_DISTANCES: readonly RaceDistance[] = [5000, 10000, 21097.5, 42195] as const;

/**
 * Mapping of race distance in meters to human-readable label
 */
export const RACE_DISTANCE_LABELS: Record<RaceDistance, RaceDistanceLabel> = {
  5000: '5K',
  10000: '10K',
  21097.5: 'Half Marathon',
  42195: 'Marathon',
} as const;

/**
 * Minimum target times in seconds per distance (based on world records)
 * - 5K: 12:35 (755 seconds)
 * - 10K: 26:11 (1571 seconds)
 * - Half Marathon: 57:30 (3450 seconds)
 * - Marathon: 2:00:35 (7235 seconds)
 */
export const TIME_MINIMUMS: Record<RaceDistance, number> = {
  5000: 755,
  10000: 1571,
  21097.5: 3450,
  42195: 7235,
} as const;

/**
 * Maximum target times in seconds per distance (based on typical race cutoffs)
 * - 5K: 1:00:00 (3600 seconds)
 * - 10K: 2:00:00 (7200 seconds)
 * - Half Marathon: 4:00:00 (14400 seconds)
 * - Marathon: 7:00:00 (25200 seconds)
 */
export const TIME_MAXIMUMS: Record<RaceDistance, number> = {
  5000: 3600,
  10000: 7200,
  21097.5: 14400,
  42195: 25200,
} as const;

/**
 * Training zone percentage ranges as fractions of VDOT pace
 * Used for deriving training paces from VDOT score
 */
export const TRAINING_ZONE_PERCENTAGES = {
  easy: { min: 0.59, max: 0.74 },
  longRun: { min: 0.65, max: 0.78 },
  marathon: { min: 0.8, max: 0.84 },
  threshold: { min: 0.88, max: 0.92 },
  interval: { min: 0.97, max: 1.0 },
  repetition: { min: 1.03, max: 1.07 },
} as const;
