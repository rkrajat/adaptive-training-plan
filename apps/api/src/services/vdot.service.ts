import type {
  RaceDistance,
  RaceDistanceLabel,
  TrainingPaces,
  PaceRange,
  RaceGoal,
  TrainingZone,
} from '@adaptive-training-plan/types';
import {
  RACE_DISTANCE_LABELS,
  TRAINING_ZONE_PERCENTAGES,
} from '@adaptive-training-plan/types';

import { log } from '../utils/logger';

/**
 * VDOT Service
 * Implements Jack Daniels' VDOT calculation and training pace derivation
 */
export class VdotService {
  /**
   * Calculate VDOT score from race distance and time
   * Based on Jack Daniels' Running Formula
   *
   * @param distanceMeters - Race distance in meters
   * @param timeSeconds - Race finish time in seconds
   * @returns VDOT score (typically 30-85 for most runners)
   */
  calculateVdot(distanceMeters: number, timeSeconds: number): number {
    // Calculate velocity in meters per minute
    const velocityMpm = (distanceMeters / timeSeconds) * 60;

    // Calculate VO2 at race pace using Daniels' formula
    const vo2 =
      -4.6 + 0.182258 * velocityMpm + 0.000104 * velocityMpm * velocityMpm;

    // Calculate time in minutes
    const timeMinutes = timeSeconds / 60;

    // Calculate fraction of VO2max being used during race
    const fraction =
      0.8 +
      0.1894393 * Math.exp(-0.012778 * timeMinutes) +
      0.2989558 * Math.exp(-0.1932605 * timeMinutes);

    // VDOT is the estimated VO2max
    const vdot = vo2 / fraction;

    log.info('VDOT calculated', {
      distanceMeters,
      timeSeconds,
      vdot: Math.round(vdot * 100) / 100,
    });

    return Math.round(vdot * 100) / 100;
  }

  /**
   * Calculate velocity (meters per minute) for a target VO2 percentage
   * Uses quadratic formula to solve Daniels' VO2 equation for velocity
   *
   * @param targetVo2 - Target VO2 value
   * @returns Velocity in meters per minute
   */
  private calculateVelocityForVo2(targetVo2: number): number {
    // Daniels' formula: VO2 = -4.6 + 0.182258*v + 0.000104*v²
    // Rearranged: 0.000104*v² + 0.182258*v + (-4.6 - targetVo2) = 0
    // Using quadratic formula: v = (-b ± sqrt(b² - 4ac)) / 2a
    const quadA = 0.000104;
    const quadB = 0.182258;
    const quadC = -4.6 - targetVo2;

    const discriminant = quadB * quadB - 4 * quadA * quadC;
    // Take positive root (higher velocity)
    const velocity = (-quadB + Math.sqrt(discriminant)) / (2 * quadA);

    return velocity;
  }

  /**
   * Convert velocity (meters per minute) to pace (seconds per km)
   *
   * @param velocityMpm - Velocity in meters per minute
   * @returns Pace in seconds per kilometer
   */
  private velocityToPace(velocityMpm: number): number {
    // meters/minute -> seconds/km
    // 1000 meters / velocityMpm meters per minute = time in minutes
    // multiply by 60 to get seconds
    return (1000 / velocityMpm) * 60;
  }

  /**
   * Derive training paces for all zones from VDOT score
   *
   * @param vdot - VDOT score
   * @returns TrainingPaces object with all six zones
   */
  deriveTrainingPaces(vdot: number): TrainingPaces {
    const zones: TrainingZone[] = [
      'easy',
      'longRun',
      'marathon',
      'threshold',
      'interval',
      'repetition',
    ];

    const paces = {} as TrainingPaces;

    for (const zone of zones) {
      const { min, max } = TRAINING_ZONE_PERCENTAGES[zone];

      // Calculate VO2 at zone percentages
      const minVo2 = vdot * min;
      const maxVo2 = vdot * max;

      // Calculate velocity at zone VO2 levels
      const minVelocity = this.calculateVelocityForVo2(minVo2);
      const maxVelocity = this.calculateVelocityForVo2(maxVo2);

      // Convert to pace (slower velocity = higher pace value)
      const minPace = Math.round(this.velocityToPace(minVelocity));
      const maxPace = Math.round(this.velocityToPace(maxVelocity));

      paces[zone] = {
        minPace, // slower pace (higher seconds/km)
        maxPace, // faster pace (lower seconds/km)
      } as PaceRange;
    }

    log.info('Training paces derived', { vdot, zones: Object.keys(paces) });

    return paces;
  }

  /**
   * Create complete race goal object with VDOT and training paces
   *
   * @param distance - Race distance in meters
   * @param targetTimeSeconds - Target finish time in seconds
   * @returns Complete RaceGoal object
   */
  createRaceGoal(distance: RaceDistance, targetTimeSeconds: number): RaceGoal {
    const vdot = this.calculateVdot(distance, targetTimeSeconds);
    const paces = this.deriveTrainingPaces(vdot);
    const distanceLabel = RACE_DISTANCE_LABELS[distance];

    return {
      distance,
      distanceLabel,
      targetTimeSeconds,
      vdot,
      paces,
      calculatedAt: new Date(),
    };
  }

  /**
   * Get distance label from distance value
   *
   * @param distance - Distance in meters
   * @returns Human-readable label
   */
  getDistanceLabel(distance: RaceDistance): RaceDistanceLabel {
    return RACE_DISTANCE_LABELS[distance];
  }
}

// Export singleton instance
export const vdotService = new VdotService();
