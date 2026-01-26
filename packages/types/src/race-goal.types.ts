/**
 * Pace range representing minimum and maximum pace for a training zone
 * Paces are stored as seconds per kilometer
 */
export interface PaceRange {
  minPace: number; // seconds per km (slower)
  maxPace: number; // seconds per km (faster)
}

/**
 * Training paces for all six training zones derived from VDOT
 * Based on Jack Daniels' Running Formula
 */
export interface TrainingPaces {
  easy: PaceRange;
  longRun: PaceRange;
  marathon: PaceRange;
  threshold: PaceRange;
  interval: PaceRange;
  repetition: PaceRange;
}

/**
 * Supported race distances in meters
 */
export type RaceDistance = 5000 | 10000 | 21097.5 | 42195;

/**
 * Human-readable race distance labels
 */
export type RaceDistanceLabel = '5K' | '10K' | 'Half Marathon' | 'Marathon';

/**
 * Race goal containing target race distance and time
 * with calculated VDOT and derived training paces
 */
export interface RaceGoal {
  distance: RaceDistance;
  distanceLabel: RaceDistanceLabel;
  targetTimeSeconds: number;
  vdot: number;
  paces: TrainingPaces;
  calculatedAt: Date;
}

/**
 * Training zone names for iteration and display
 */
export type TrainingZone = keyof TrainingPaces;
