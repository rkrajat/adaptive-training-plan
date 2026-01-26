import type { PaceRange, TrainingPaces } from '@adaptive-training-plan/types';

/**
 * Formatted pace range with human-readable strings
 */
export interface FormattedPaceRange {
  minPace: string; // e.g., "5:30"
  maxPace: string; // e.g., "5:00"
  range: string; // e.g., "5:00 - 5:30"
}

/**
 * Formatted training paces with human-readable strings
 */
export interface FormattedTrainingPaces {
  easy: FormattedPaceRange;
  longRun: FormattedPaceRange;
  marathon: FormattedPaceRange;
  threshold: FormattedPaceRange;
  interval: FormattedPaceRange;
  repetition: FormattedPaceRange;
}

/**
 * Convert seconds to mm:ss format
 *
 * @param seconds - Pace in seconds
 * @returns Formatted pace string (e.g., "5:30")
 */
export const formatPace = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
};

/**
 * Format a pace range to human-readable strings
 *
 * @param paceRange - PaceRange with minPace and maxPace in seconds
 * @returns FormattedPaceRange with display strings
 */
export const formatPaceRange = (paceRange: PaceRange): FormattedPaceRange => {
  const minPaceFormatted = formatPace(paceRange.minPace);
  const maxPaceFormatted = formatPace(paceRange.maxPace);

  return {
    minPace: minPaceFormatted,
    maxPace: maxPaceFormatted,
    range: `${maxPaceFormatted} - ${minPaceFormatted}`, // faster to slower
  };
};

/**
 * Format all training paces to human-readable strings
 *
 * @param paces - TrainingPaces object with all zones
 * @returns FormattedTrainingPaces with display strings for all zones
 */
export const formatTrainingPaces = (
  paces: TrainingPaces
): FormattedTrainingPaces => {
  return {
    easy: formatPaceRange(paces.easy),
    longRun: formatPaceRange(paces.longRun),
    marathon: formatPaceRange(paces.marathon),
    threshold: formatPaceRange(paces.threshold),
    interval: formatPaceRange(paces.interval),
    repetition: formatPaceRange(paces.repetition),
  };
};

/**
 * Format pace for display with /km suffix
 *
 * @param seconds - Pace in seconds
 * @returns Formatted pace string with unit (e.g., "5:30 /km")
 */
export const formatPaceWithUnit = (seconds: number): string => {
  return `${formatPace(seconds)} /km`;
};
