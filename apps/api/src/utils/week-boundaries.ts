/**
 * Week Boundary Calculation Utilities
 * Calculates date ranges for training plan weeks
 */

export interface WeekBoundaries {
  weekStartDate: string; // ISO date string YYYY-MM-DD
  weekEndDate: string; // ISO date string YYYY-MM-DD
  weekStartTimestamp: number; // Unix timestamp in seconds
  weekEndTimestamp: number; // Unix timestamp in seconds
}

/**
 * Calculate the start and end dates for a specific training week
 *
 * @param startDate - The training plan start date in YYYY-MM-DD format
 * @param weekNumber - The week number (1-indexed)
 * @returns WeekBoundaries object with date strings and timestamps
 *
 * Week boundaries are calculated as:
 * - weekStart = startDate + (weekNumber - 1) * 7 days
 * - weekEnd = weekStart + 6 days (inclusive 7-day week)
 */
export const calculateWeekBoundaries = (
  startDate: string,
  weekNumber: number
): WeekBoundaries => {
  // Parse the start date
  const planStartDate = new Date(startDate);
  planStartDate.setUTCHours(0, 0, 0, 0);

  // Calculate week start: add (weekNumber - 1) * 7 days
  const weekStartDate = new Date(planStartDate);
  weekStartDate.setUTCDate(planStartDate.getUTCDate() + (weekNumber - 1) * 7);

  // Calculate week end: add 6 days to week start (inclusive 7-day week)
  const weekEndDate = new Date(weekStartDate);
  weekEndDate.setUTCDate(weekStartDate.getUTCDate() + 6);
  // Set to end of day for inclusive range
  weekEndDate.setUTCHours(23, 59, 59, 999);

  // Format dates as YYYY-MM-DD
  const formatDate = (date: Date): string => {
    return date.toISOString().split("T")[0];
  };

  return {
    weekStartDate: formatDate(weekStartDate),
    weekEndDate: formatDate(weekEndDate),
    weekStartTimestamp: Math.floor(weekStartDate.getTime() / 1000),
    weekEndTimestamp: Math.floor(weekEndDate.getTime() / 1000),
  };
};

/**
 * Check if an activity date falls within the week boundaries
 *
 * @param activityDate - The activity start date (ISO string)
 * @param boundaries - The week boundaries to check against
 * @returns true if the activity falls within the week
 */
export const isActivityInWeek = (
  activityDate: string,
  boundaries: WeekBoundaries
): boolean => {
  const activityTimestamp = Math.floor(new Date(activityDate).getTime() / 1000);
  return (
    activityTimestamp >= boundaries.weekStartTimestamp &&
    activityTimestamp <= boundaries.weekEndTimestamp
  );
};
