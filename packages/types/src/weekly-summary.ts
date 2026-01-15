/**
 * Weekly Summary Types
 * Types for weekly runs report feature
 */

/**
 * Weekly summary data for runs report
 * All measurements are in base units (meters, seconds)
 */
export interface WeeklySummaryData {
  totalDistance: number; // Total distance in meters
  numberOfRuns: number; // Count of run activities
  averagePace: number; // Average pace in seconds per kilometer
  totalTime: number; // Total moving time in seconds
  longestRun: number; // Longest single run distance in meters
  weekStartDate: string; // ISO date string YYYY-MM-DD
  weekEndDate: string; // ISO date string YYYY-MM-DD
}

/**
 * API response wrapper for weekly summary
 */
export interface WeeklySummaryResponse {
  success: true;
  data: WeeklySummaryData;
}

/**
 * Props for WeeklyRunsReport component
 */
export interface WeeklyRunsReportProps {
  currentWeek: number;
  startDate: string; // ISO date string YYYY-MM-DD
}
