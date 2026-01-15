import type { WeeklySummaryData } from "@adaptive-training-plan/types";

import type { FormattedActivity } from "../types/strava.types";
import { log } from "../utils/logger";
import {
  calculateWeekBoundaries,
  isActivityInWeek,
  type WeekBoundaries,
} from "../utils/week-boundaries";

/**
 * Weekly Summary Service
 * Handles aggregation of Strava activities for weekly reports
 */
export class WeeklySummaryService {
  /**
   * Calculate weekly summary from activities
   *
   * @param activities - Array of formatted Strava activities
   * @param startDate - Training plan start date (YYYY-MM-DD)
   * @param weekNumber - Week number to summarize (1-indexed)
   * @returns WeeklySummaryData with aggregated metrics
   */
  calculateWeeklySummary(
    activities: FormattedActivity[],
    startDate: string,
    weekNumber: number
  ): WeeklySummaryData {
    // Calculate week boundaries
    const boundaries = calculateWeekBoundaries(startDate, weekNumber);

    // Filter activities to only runs within the week
    const weeklyRuns = this.filterWeeklyRuns(activities, boundaries);

    log.info("Calculating weekly summary", {
      startDate,
      weekNumber,
      weekStartDate: boundaries.weekStartDate,
      weekEndDate: boundaries.weekEndDate,
      totalActivities: activities.length,
      runsInWeek: weeklyRuns.length,
    });

    // Calculate aggregated metrics
    return this.aggregateMetrics(weeklyRuns, boundaries);
  }

  /**
   * Filter activities to only include runs within the specified week
   */
  private filterWeeklyRuns(
    activities: FormattedActivity[],
    boundaries: WeekBoundaries
  ): FormattedActivity[] {
    return activities.filter((activity) => {
      // Only include "Run" type activities
      const isRun = activity.type === "Run";
      // Check if activity falls within week boundaries
      const inWeek = isActivityInWeek(activity.startDate, boundaries);
      return isRun && inWeek;
    });
  }

  /**
   * Aggregate metrics from filtered run activities
   */
  private aggregateMetrics(
    runs: FormattedActivity[],
    boundaries: WeekBoundaries
  ): WeeklySummaryData {
    // Handle empty week case
    if (runs.length === 0) {
      return {
        totalDistance: 0,
        numberOfRuns: 0,
        averagePace: 0,
        totalTime: 0,
        longestRun: 0,
        weekStartDate: boundaries.weekStartDate,
        weekEndDate: boundaries.weekEndDate,
      };
    }

    // Calculate totals
    const totalDistance = runs.reduce((sum, run) => sum + run.distance, 0);
    const totalTime = runs.reduce((sum, run) => sum + run.movingTime, 0);
    const longestRun = Math.max(...runs.map((run) => run.distance));

    // Calculate average pace (seconds per km)
    // Formula: totalTime / (totalDistance / 1000)
    const averagePace =
      totalDistance > 0 ? totalTime / (totalDistance / 1000) : 0;

    return {
      totalDistance,
      numberOfRuns: runs.length,
      averagePace: Math.round(averagePace), // Round to nearest second
      totalTime,
      longestRun,
      weekStartDate: boundaries.weekStartDate,
      weekEndDate: boundaries.weekEndDate,
    };
  }
}

// Export singleton instance
export const weeklySummaryService = new WeeklySummaryService();
