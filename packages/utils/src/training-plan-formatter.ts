import { stringify } from "csv-stringify/sync";

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
 * Calculate current week number based on training plan start date and today's date
 *
 * This function dynamically calculates which week of the training plan the user is currently in.
 * Week 1 starts on the startDate, Week 2 starts 7 days later, etc.
 *
 * @param startDate - Training plan start date (string or Date object)
 * @returns Current week number (0 if plan hasn't started, 1+ for active weeks)
 *
 * @example
 * // Plan started 14 days ago
 * getCurrentWeekNumber('2024-01-01') // Returns 3
 *
 * @example
 * // Plan starts tomorrow
 * getCurrentWeekNumber('2024-12-31') // Returns 0
 */
export const getCurrentWeekNumber = (startDate: string | Date): number => {
  try {
    // Get today's date
    const today = new Date();
    const todayString = today.toISOString().split("T")[0]; // YYYY-MM-DD format

    // Convert startDate to string format if it's a Date object
    const startDateString =
      typeof startDate === "string"
        ? startDate
        : startDate.toISOString().split("T")[0];

    // Use existing calculateWeekFromDate function
    const weekNumber = calculateWeekFromDate(todayString, startDateString);

    // If weekNumber is -1, it means today is before the start date
    // Return 0 to indicate the plan hasn't started yet
    if (weekNumber === -1) {
      return 0;
    }

    // Return the calculated week number (1+)
    return weekNumber;
  } catch {
    // In case of any error, default to week 1
    return 1;
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
          console.warn(`Invalid date or date before start date: ${dateValue}`);
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

/**
 * Recalculate dates in CSV content based on new start date
 * Uses sequential date assignment to ensure valid dates and day-of-week synchronization
 *
 * @param csvContent - Raw CSV string content
 * @param oldStartDate - Original training plan start date (YYYY-MM-DD) - not used but kept for API compatibility
 * @param newStartDate - New training plan start date (YYYY-MM-DD)
 * @returns Updated CSV string with recalculated sequential dates
 *
 * @example
 * const oldCsv = "date,day,type\n2024-01-01,Mon,Easy\n2024-01-02,Tue,Tempo"
 * const newCsv = recalculateCsvDates(oldCsv, "2024-01-01", "2024-02-01")
 * // Returns: "date,day,type\n2024-02-01,Thu,Easy\n2024-02-02,Fri,Tempo"
 */
export const recalculateCsvDates = (
  csvContent: string,
  _oldStartDate: string,
  newStartDate: string
): string => {
  try {
    const parsed = parseCsvContent(csvContent);

    // Find date column (case-insensitive)
    const dateHeader = parsed.headers.find(
      (header) => header.toLowerCase() === "date"
    );

    if (!dateHeader) {
      // No date column - return original content unchanged
      return csvContent;
    }

    // Find day column (case-insensitive) - optional
    const dayHeader = parsed.headers.find(
      (header) => header.toLowerCase() === "day"
    );

    // Day names mapping (Sunday = 0, Monday = 1, ..., Saturday = 6)
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    // Parse the new start date
    const startDate = new Date(newStartDate);

    // Validate start date
    if (isNaN(startDate.getTime())) {
      console.error("Invalid new start date:", newStartDate);
      return csvContent;
    }

    // Update each row's date sequentially
    const updatedRows = parsed.rows.map((row, index) => {
      // Calculate date for this row: startDate + index days
      // Using getTime() + milliseconds ensures proper date arithmetic
      // Handles month/year boundaries and leap years automatically
      const currentDate = new Date(
        startDate.getTime() + index * 24 * 60 * 60 * 1000
      );

      // Format date as YYYY-MM-DD
      const formattedDate = currentDate.toISOString().split("T")[0];

      // Calculate day of week (0 = Sunday, 6 = Saturday)
      const dayOfWeek = dayNames[currentDate.getDay()];

      // Update the row with new date and day
      const updatedRow = {
        ...row,
        [dateHeader]: formattedDate,
      };

      // Update day column if it exists
      if (dayHeader) {
        updatedRow[dayHeader] = dayOfWeek;
      }

      return updatedRow;
    });

    // Rebuild CSV string using csv-stringify for proper RFC 4180 escaping
    // This ensures values with commas, quotes, or newlines are properly quoted
    const csvString = stringify(updatedRows, {
      header: true,
      columns: parsed.headers,
    });

    // Remove trailing newline added by stringify to match original format
    return csvString.trim();
  } catch (error) {
    // If any error occurs, return original content
    console.error("Failed to recalculate CSV dates:", error);
    return csvContent;
  }
};
