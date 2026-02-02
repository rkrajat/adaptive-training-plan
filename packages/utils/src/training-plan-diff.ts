import type { ParsedMarkdownTable } from "./markdown-table-parser";
import { findMatchingHeader, HEADER_MAPPINGS } from "./markdown-table-parser";

/**
 * Type of change detected in a field
 */
export type ChangeType = "added" | "removed" | "modified" | "unchanged";

/**
 * Represents a single field change
 */
export interface FieldChange {
  field: string;
  fieldKey: string;
  original: string;
  modified: string;
  changeType: ChangeType;
  /** For numeric fields, indicates direction of change */
  direction?: "increased" | "decreased";
}

/**
 * Represents all changes for a single day/row
 */
export interface RowDiff {
  date: string;
  day: string;
  /** Whether this is a new row not in original plan */
  isNewRow: boolean;
  /** Whether this row was removed (in original but not in modified) */
  isRemovedRow: boolean;
  /** Individual field changes */
  changes: FieldChange[];
  /** Whether any changes exist for this row */
  hasChanges: boolean;
}

/**
 * Complete diff result
 */
export interface TrainingPlanDiff {
  rows: RowDiff[];
  /** Summary statistics */
  summary: {
    totalRows: number;
    rowsWithChanges: number;
    newRows: number;
    removedRows: number;
    modifiedRows: number;
    unchangedRows: number;
  };
}

/**
 * Normalize a date string to YYYY-MM-DD format for comparison
 */
const normalizeDate = (dateStr: string): string => {
  if (!dateStr) return "";

  // Already in YYYY-MM-DD format
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr;
  }

  // Try to parse and format
  const parsed = new Date(dateStr);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split("T")[0];
  }

  return dateStr.trim().toLowerCase();
};

/**
 * Values that represent "empty" or "no data"
 * These are all treated as equivalent when comparing
 */
const EMPTY_VALUE_PATTERNS = [
  "",
  "-",
  "--",
  "n/a",
  "na",
  "none",
  "null",
  "undefined",
];

/**
 * Check if a value represents an empty/null value
 */
const isEmptyValue = (value: string): boolean => {
  if (!value) return true;
  const normalized = value.trim().toLowerCase();
  return EMPTY_VALUE_PATTERNS.includes(normalized);
};

/**
 * Normalize a value for comparison
 * Treats all empty-like values (-, N/A, none, etc.) as equivalent empty strings
 */
const normalizeValue = (value: string): string => {
  if (isEmptyValue(value)) return "";
  return value.trim().toLowerCase();
};

/**
 * Parse a numeric value from a string (handles "5km", "5.0", etc.)
 */
const parseNumeric = (value: string): number | null => {
  if (!value) return null;

  // Remove common suffixes and extract number
  const cleaned = value.replace(/[^\d.-]/g, "");
  const num = parseFloat(cleaned);

  return isNaN(num) ? null : num;
};

/**
 * Compare two values and determine the change type
 */
const compareValues = (
  original: string,
  modified: string,
  isNumeric: boolean = false
): { changeType: ChangeType; direction?: "increased" | "decreased" } => {
  const origNorm = normalizeValue(original);
  const modNorm = normalizeValue(modified);

  // Both empty - unchanged
  if (!origNorm && !modNorm) {
    return { changeType: "unchanged" };
  }

  // Original empty, modified has value - added
  if (!origNorm && modNorm) {
    return { changeType: "added" };
  }

  // Original has value, modified empty - removed
  if (origNorm && !modNorm) {
    return { changeType: "removed" };
  }

  // Both have values - compare
  if (origNorm === modNorm) {
    return { changeType: "unchanged" };
  }

  // Values are different - determine direction for numeric
  if (isNumeric) {
    const origNum = parseNumeric(original);
    const modNum = parseNumeric(modified);

    if (origNum !== null && modNum !== null) {
      const direction = modNum > origNum ? "increased" : "decreased";
      return { changeType: "modified", direction };
    }
  }

  return { changeType: "modified" };
};

/**
 * Fields that should be compared numerically
 */
const NUMERIC_FIELDS = ["distance", "pace"];

/**
 * Get the value for a specific field key from a row using header mappings
 */
const getFieldValue = (
  row: Record<string, string>,
  fieldKey: keyof typeof HEADER_MAPPINGS,
  headers: string[]
): string => {
  const header = findMatchingHeader(headers, fieldKey);
  if (header && row[header] !== undefined) {
    return row[header];
  }
  return "";
};

/**
 * Compare original training plan with LLM-modified plan
 *
 * @param originalPlan - Parsed table from original training plan
 * @param modifiedPlan - Parsed table from LLM output
 * @returns Complete diff result showing all changes
 */
export const compareTrainingPlans = (
  originalPlan: ParsedMarkdownTable,
  modifiedPlan: ParsedMarkdownTable
): TrainingPlanDiff => {
  const result: TrainingPlanDiff = {
    rows: [],
    summary: {
      totalRows: 0,
      rowsWithChanges: 0,
      newRows: 0,
      removedRows: 0,
      modifiedRows: 0,
      unchangedRows: 0,
    },
  };

  // Create a map of original rows by date
  const originalByDate = new Map<string, Record<string, string>>();
  const dateHeaderOrig = findMatchingHeader(originalPlan.headers, "date");

  if (dateHeaderOrig) {
    for (const row of originalPlan.rows) {
      const date = normalizeDate(row[dateHeaderOrig]);
      if (date) {
        originalByDate.set(date, row);
      }
    }
  }

  // Create a map of modified rows by date
  const modifiedByDate = new Map<string, Record<string, string>>();
  const dateHeaderMod = findMatchingHeader(modifiedPlan.headers, "date");

  if (dateHeaderMod) {
    for (const row of modifiedPlan.rows) {
      const date = normalizeDate(row[dateHeaderMod]);
      if (date) {
        modifiedByDate.set(date, row);
      }
    }
  }

  // Get all unique dates from both plans
  const allDates = new Set<string>([
    ...originalByDate.keys(),
    ...modifiedByDate.keys(),
  ]);

  // Sort dates chronologically
  const sortedDates = Array.from(allDates).sort((dateA, dateB) => {
    return new Date(dateA).getTime() - new Date(dateB).getTime();
  });

  // Compare each date
  for (const date of sortedDates) {
    const originalRow = originalByDate.get(date);
    const modifiedRow = modifiedByDate.get(date);

    const rowDiff: RowDiff = {
      date,
      day: "",
      isNewRow: !originalRow && !!modifiedRow,
      isRemovedRow: !!originalRow && !modifiedRow,
      changes: [],
      hasChanges: false,
    };

    // Get day value
    if (modifiedRow) {
      rowDiff.day = getFieldValue(modifiedRow, "day", modifiedPlan.headers);
    } else if (originalRow) {
      rowDiff.day = getFieldValue(originalRow, "day", originalPlan.headers);
    }

    // Fields to compare
    const fieldsToCompare: { key: keyof typeof HEADER_MAPPINGS; label: string }[] =
      [
        { key: "runType", label: "Run Type" },
        { key: "distance", label: "Distance" },
        { key: "pace", label: "Pace" },
        { key: "hrZone", label: "HR Zone" },
        { key: "notes", label: "Notes" },
      ];

    // Compare each field
    for (const { key, label } of fieldsToCompare) {
      const originalValue = originalRow
        ? getFieldValue(originalRow, key, originalPlan.headers)
        : "";
      const modifiedValue = modifiedRow
        ? getFieldValue(modifiedRow, key, modifiedPlan.headers)
        : "";

      const isNumeric = NUMERIC_FIELDS.includes(key);
      const comparison = compareValues(originalValue, modifiedValue, isNumeric);

      const fieldChange: FieldChange = {
        field: label,
        fieldKey: key,
        original: originalValue,
        modified: modifiedValue,
        changeType: comparison.changeType,
        direction: comparison.direction,
      };

      rowDiff.changes.push(fieldChange);

      if (comparison.changeType !== "unchanged") {
        rowDiff.hasChanges = true;
      }
    }

    result.rows.push(rowDiff);
    result.summary.totalRows++;

    // Update summary counts
    if (rowDiff.isNewRow) {
      result.summary.newRows++;
      result.summary.rowsWithChanges++;
    } else if (rowDiff.isRemovedRow) {
      result.summary.removedRows++;
      result.summary.rowsWithChanges++;
    } else if (rowDiff.hasChanges) {
      result.summary.modifiedRows++;
      result.summary.rowsWithChanges++;
    } else {
      result.summary.unchangedRows++;
    }
  }

  return result;
};

/**
 * Create a ParsedMarkdownTable from original training plan CSV data
 * Converts the CSV structure to match the markdown table format
 *
 * @param csvRows - Rows from parsed CSV (Record<string, string>[])
 * @param csvHeaders - Headers from parsed CSV
 * @returns ParsedMarkdownTable compatible with diff comparison
 */
export const createTableFromCsvData = (
  csvRows: Record<string, string>[],
  csvHeaders: string[]
): ParsedMarkdownTable => {
  return {
    headers: csvHeaders,
    rows: csvRows,
  };
};

/**
 * Format a change for display (e.g., "5km -> 8km" or "was: 5km")
 */
export const formatChangeDisplay = (change: FieldChange): string => {
  if (change.changeType === "unchanged") {
    return change.modified || change.original;
  }

  if (change.changeType === "added") {
    return change.modified;
  }

  if (change.changeType === "removed") {
    return `was: ${change.original}`;
  }

  // Modified
  return `${change.original} -> ${change.modified}`;
};
