import { parse } from "csv-parse/sync";

import { AppError } from "./error";

/**
 * Parse CSV content from buffer to string
 * According to spec: CSV content is stored as raw string for LLM-friendly format
 * This function validates that the content is parseable without performing deep validation
 */
export const parseCsvBuffer = (buffer: Buffer): string => {
  try {
    const csvContent = buffer.toString("utf-8").trim();

    if (!csvContent) {
      throw new AppError("CSV file is empty", 400);
    }

    // Basic validation: ensure it has at least some CSV-like structure
    const lines = csvContent.split("\n").filter((line) => line.trim());

    if (lines.length < 2) {
      throw new AppError(
        "CSV file must contain at least a header row and one data row",
        400
      );
    }

    // Check if first line looks like a header (contains commas)
    const headerLine = lines[0];
    if (!headerLine.includes(",")) {
      throw new AppError(
        "CSV file must be comma-separated with a header row",
        400
      );
    }

    return csvContent;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to parse CSV file: ${String(error)}`, 400);
  }
};

/**
 * Parse CSV string into structured weeks data for internal processing
 * Returns array of objects representing each week's training data
 */
export interface WeekData {
  week: number;
  [key: string]: string | number;
}

export const parseCsvToWeeksData = (csvContent: string): WeekData[] => {
  try {
    // Use csv-parse to properly handle quoted fields and RFC 4180 CSV format
    const records = parse(csvContent, {
      columns: true, // Use first row as headers and map to object keys
      skip_empty_lines: true, // Skip empty lines
      trim: true, // Trim whitespace from values
      relax_column_count: false, // Enforce consistent column counts
    }) as Record<string, string>[];

    if (records.length === 0) {
      throw new AppError("CSV must have at least one data row", 400);
    }

    // Transform parsed records to WeekData format
    const weeksData: WeekData[] = records.map((record, index) => {
      const rowData: WeekData = { week: index + 1 };

      // Convert all header keys to lowercase and copy values
      Object.keys(record).forEach((header) => {
        rowData[header.toLowerCase()] = record[header];
      });

      return rowData;
    });

    return weeksData;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      `Failed to parse CSV to weeks data: ${String(error)}`,
      400
    );
  }
};
