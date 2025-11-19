import { parseCsvContent } from "./csv-parser";

/**
 * Grouped week data structure
 */
export interface GroupedWeekData {
  weekNumber: number;
  rows: Record<string, string>[];
}

/**
 * Result of grouping training plan by week
 */
export interface GroupedTrainingPlanResult {
  headers: string[];
  groupedWeeks: GroupedWeekData[];
  error: string | null;
}

/**
 * Calculate week number from a date string and training plan start date
 *
 * @param dateString - The date string to convert to week number
 * @param startDateString - The training plan start date
 * @returns Week number (1-indexed) or -1 if invalid
 */
export const calculateWeekFromDate = (
  dateString: string,
  startDateString: string
): number => {
  try {
    const rowDate = new Date(dateString);
    const startDate = new Date(startDateString);

    // Validate dates
    if (isNaN(rowDate.getTime()) || isNaN(startDate.getTime())) {
      return -1;
    }

    // Calculate difference in days
    const diffTime = rowDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Calculate week number (1-indexed)
    const weekNumber = Math.floor(diffDays / 7) + 1;

    // Handle dates before start date
    return weekNumber < 1 ? -1 : weekNumber;
  } catch {
    return -1;
  }
};

/**
 * Group training plan rows by week number
 *
 * This function intelligently handles two scenarios:
 * 1. If CSV has a "week" column - uses that directly
 * 2. If CSV only has a "date" column - calculates week number from training plan start date
 *
 * @param csvContent - Raw CSV string content
 * @param startDate - Training plan start date (used for date-based week calculation)
 * @returns Grouped training plan data with headers, grouped weeks, and any error
 */
export const groupTrainingPlanByWeek = (
  csvContent: string,
  startDate: string
): GroupedTrainingPlanResult => {
  try {
    const parsed = parseCsvContent(csvContent);

    // Try to find 'week' column first (case-insensitive)
    const weekHeader = parsed.headers.find(
      (header) => header.toLowerCase() === "week"
    );

    // If no week column, try to find 'date' column for calculation
    const dateHeader = weekHeader
      ? null
      : parsed.headers.find((header) => header.toLowerCase() === "date");

    // If neither week nor date column exists, return error
    if (!weekHeader && !dateHeader) {
      return {
        headers: [],
        groupedWeeks: [],
        error: 'CSV content must contain either a "week" or "date" column',
      };
    }

    // Group rows by week number
    const weekMap = new Map<number, Record<string, string>[]>();

    for (const row of parsed.rows) {
      let weekNumber: number;

      if (weekHeader) {
        // Use existing week column
        const weekValue = row[weekHeader];
        weekNumber = parseInt(weekValue, 10);

        if (isNaN(weekNumber)) {
          console.warn(`Invalid week number: ${weekValue}`);
          continue;
        }
      } else if (dateHeader) {
        // Calculate week from date
        const dateValue = row[dateHeader];
        weekNumber = calculateWeekFromDate(dateValue, startDate);

        if (weekNumber === -1) {
          console.warn(
            `Invalid date or date before start date: ${dateValue}`
          );
          continue;
        }
      } else {
        continue;
      }

      if (!weekMap.has(weekNumber)) {
        weekMap.set(weekNumber, []);
      }

      weekMap.get(weekNumber)?.push(row);
    }

    // Convert to sorted array
    const grouped: GroupedWeekData[] = Array.from(weekMap.entries())
      .map(([weekNumber, rows]) => ({
        weekNumber,
        rows,
      }))
      .sort((weekA, weekB) => weekA.weekNumber - weekB.weekNumber);

    return {
      headers: parsed.headers,
      groupedWeeks: grouped,
      error: null,
    };
  } catch (parseError) {
    return {
      headers: [],
      groupedWeeks: [],
      error:
        parseError instanceof Error
          ? parseError.message
          : "Failed to parse CSV content",
    };
  }
};
