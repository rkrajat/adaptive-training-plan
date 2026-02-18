import { groupTrainingPlanByWeek } from "@adaptive-training-plan/utils";

import type { EnhancedFormattedActivity } from "../types/strava.types";

/**
 * Training adherence metrics calculated from plan vs actual activities
 * Used to ensure consistency between training status and recommendations
 */
export interface TrainingMetrics {
  plannedRuns: number;
  completedRuns: number;
  completionPercentage: number;
  plannedDistanceKm: number;
  actualDistanceKm: number;
  distanceDeviationPercentage: number;
  adherenceLevel: "strong" | "moderate" | "weak";
  longRunsPlanned: number;
  longRunsCompleted: number;
}

/**
 * Calculate training adherence metrics from activities and training plan
 * Uses the same thresholds as training status to ensure consistency
 *
 * Thresholds:
 * - Strong: completion >= 80%, distance deviation <= 15%
 * - Moderate: completion 60-79%, distance deviation 16-30%
 * - Weak: completion < 60% OR distance deviation > 30%
 */
export const calculateTrainingMetrics = (
  activities: EnhancedFormattedActivity[],
  csvContent: string,
  startDate: string,
  currentWeek: number,
): TrainingMetrics => {
  // Parse training plan for current and previous week
  const { groupedWeeks } = groupTrainingPlanByWeek(csvContent, startDate);

  const previousWeek = currentWeek > 1 ? currentWeek - 1 : 1;
  const relevantWeeks = groupedWeeks.filter(
    (week) =>
      week.weekNumber === previousWeek || week.weekNumber === currentWeek,
  );

  // Calculate planned metrics
  let plannedRuns = 0;
  let plannedDistanceKm = 0;
  let longRunsPlanned = 0;

  for (const week of relevantWeeks) {
    for (const row of week.rows) {
      const type = (row["type"] || row["Type"] || "").toLowerCase();
      const distance = parseFloat(row["planned_distance_km"] || "0");

      if (type !== "rest" && type !== "cross-training") {
        plannedRuns++;
        plannedDistanceKm += distance;
        if (type === "long") longRunsPlanned++;
      }
    }
  }

  // Calculate actual metrics from activities
  const completedRuns = activities.length;
  const actualDistanceKm = activities.reduce(
    (sum, act) => sum + act.actual_distance_km,
    0,
  );
  const longRunsCompleted = activities.filter(
    (act) =>
      act.actual_run_type?.toLowerCase() === "long" ||
      act.actual_distance_km >= 15,
  ).length;

  // Calculate percentages
  const completionPercentage =
    plannedRuns > 0 ? Math.round((completedRuns / plannedRuns) * 100) : 0;

  const distanceDeviationPercentage =
    plannedDistanceKm > 0
      ? Math.round(
          Math.abs((actualDistanceKm - plannedDistanceKm) / plannedDistanceKm) *
            100,
        )
      : 0;

  // Determine adherence level using same thresholds as training status
  let adherenceLevel: "strong" | "moderate" | "weak";
  if (completionPercentage >= 80 && distanceDeviationPercentage <= 15) {
    adherenceLevel = "strong";
  } else if (completionPercentage >= 60 && distanceDeviationPercentage <= 30) {
    adherenceLevel = "moderate";
  } else {
    adherenceLevel = "weak";
  }

  return {
    plannedRuns,
    completedRuns,
    completionPercentage,
    plannedDistanceKm: Math.round(plannedDistanceKm * 10) / 10,
    actualDistanceKm: Math.round(actualDistanceKm * 10) / 10,
    distanceDeviationPercentage,
    adherenceLevel,
    longRunsPlanned,
    longRunsCompleted,
  };
};
