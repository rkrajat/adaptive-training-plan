import { parse } from 'csv-parse/sync';

/**
 * Parsed CSV data structure
 */
export interface ParsedCsvData {
  headers: string[];
  rows: Record<string, string>[];
}

/**
 * Format a CSV header to be human-readable
 * Examples:
 *   "planned_run_type" -> "Planned Run Type"
 *   "target_pace_min_per_km" -> "Target Pace Min Per Km"
 *   "date" -> "Date"
 */
export const formatHeader = (header: string): string => {
  return header
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Parse CSV content into structured data using standard csv-parse library
 *
 * @param csvContent - Raw CSV string content
 * @returns Parsed data with headers and rows
 * @throws Error if CSV content is empty or malformed
 */
export const parseCsvContent = (csvContent: string): ParsedCsvData => {
  // Handle empty content
  if (!csvContent || csvContent.trim().length === 0) {
    throw new Error('CSV content is empty');
  }

  try {
    // Use csv-parse to properly handle quoted fields and RFC 4180 CSV format
    const records = parse(csvContent, {
      columns: true, // Use first row as headers and map to object keys
      skip_empty_lines: true, // Skip empty lines
      trim: true, // Trim whitespace from values
      relax_column_count: false, // Enforce consistent column counts
    }) as Record<string, string>[];

    if (records.length === 0) {
      throw new Error('CSV content must contain at least a header row and one data row');
    }

    // Extract headers from first record
    const headers = Object.keys(records[0]);

    if (headers.length === 0) {
      throw new Error('CSV content contains no headers');
    }

    return {
      headers,
      rows: records,
    };
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse CSV content: ${error.message}`);
    }
    throw new Error('Failed to parse CSV content');
  }
};
