import {
  TrainingPlanRowSchema,
  TrainingPlanSchema,
  getExpectedDayForDate,
  type TrainingPlanRow,
  type TrainingPlan,
} from "../schemas/training-plan-row.schema";
import { log } from "../utils/logger";

/**
 * Validation error for a specific field in a row
 */
export interface ValidationError {
  rowIndex: number;
  field: string;
  value: unknown;
  message: string;
}

/**
 * Result of validating a training plan
 */
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  validRows: TrainingPlanRow[];
  invalidRows: { rowIndex: number; row: unknown; errors: ValidationError[] }[];
}

/**
 * PDF Validation Service
 * Provides row-level validation with detailed error reporting
 */
export class PdfValidationService {
  /**
   * Validate a training plan with detailed row-level errors
   * @param plan - The training plan object to validate
   * @returns ValidationResult with valid/invalid rows and detailed errors
   */
  validateTrainingPlan(plan: unknown): ValidationResult {
    const errors: ValidationError[] = [];
    const validRows: TrainingPlanRow[] = [];
    const invalidRows: { rowIndex: number; row: unknown; errors: ValidationError[] }[] = [];

    // First, check if plan has the expected structure
    if (!plan || typeof plan !== "object") {
      errors.push({
        rowIndex: -1,
        field: "plan",
        value: plan,
        message: "Training plan must be an object",
      });
      return { isValid: false, errors, validRows, invalidRows };
    }

    const planObj = plan as { rows?: unknown };

    if (!Array.isArray(planObj.rows)) {
      errors.push({
        rowIndex: -1,
        field: "rows",
        value: planObj.rows,
        message: "Training plan must have a 'rows' array",
      });
      return { isValid: false, errors, validRows, invalidRows };
    }

    if (planObj.rows.length === 0) {
      errors.push({
        rowIndex: -1,
        field: "rows",
        value: [],
        message: "Training plan must have at least one row",
      });
      return { isValid: false, errors, validRows, invalidRows };
    }

    // Validate each row
    planObj.rows.forEach((row, index) => {
      const rowErrors: ValidationError[] = [];

      // Schema validation
      const rowResult = TrainingPlanRowSchema.safeParse(row);

      if (!rowResult.success) {
        // Collect schema validation errors
        rowResult.error.issues.forEach((issue) => {
          rowErrors.push({
            rowIndex: index,
            field: issue.path.join(".") || "unknown",
            value: this.getNestedValue(row, issue.path),
            message: issue.message,
          });
        });
      } else {
        // Schema passed, now apply business rules
        const validatedRow = rowResult.data;

        // Business Rule 1: Date must match day
        const expectedDay = getExpectedDayForDate(validatedRow.date);
        if (expectedDay && validatedRow.day !== expectedDay) {
          rowErrors.push({
            rowIndex: index,
            field: "day",
            value: validatedRow.day,
            message: `Day "${validatedRow.day}" does not match date ${validatedRow.date} (should be "${expectedDay}")`,
          });
        }

        // Business Rule 2: Rest days should have 0 distance
        if (validatedRow.type === "Rest" && validatedRow.planned_distance_km > 0) {
          rowErrors.push({
            rowIndex: index,
            field: "planned_distance_km",
            value: validatedRow.planned_distance_km,
            message: `Rest days should have 0 distance (got ${validatedRow.planned_distance_km}km)`,
          });
        }

        // Business Rule 3: Non-rest days with distance should have a type
        if (
          validatedRow.planned_distance_km > 0 &&
          validatedRow.type === "Rest"
        ) {
          rowErrors.push({
            rowIndex: index,
            field: "type",
            value: validatedRow.type,
            message: "Days with distance > 0 should not be marked as Rest",
          });
        }
      }

      // Categorize the row
      if (rowErrors.length > 0) {
        invalidRows.push({ rowIndex: index, row, errors: rowErrors });
        errors.push(...rowErrors);
      } else {
        const parsedRow = TrainingPlanRowSchema.parse(row);
        validRows.push(parsedRow);
      }
    });

    const result: ValidationResult = {
      isValid: errors.length === 0,
      errors,
      validRows,
      invalidRows,
    };

    log.debug("Training plan validation completed", {
      isValid: result.isValid,
      totalRows: planObj.rows.length,
      validRows: validRows.length,
      invalidRows: invalidRows.length,
      errorCount: errors.length,
    });

    return result;
  }

  /**
   * Format validation errors for inclusion in retry prompt
   * Groups errors by row and formats them in a human-readable way
   * @param errors - Array of validation errors
   * @returns Formatted string for LLM retry prompt
   */
  formatErrorsForRetry(errors: ValidationError[]): string {
    if (errors.length === 0) {
      return "";
    }

    // Group errors by row
    const grouped = errors.reduce(
      (acc, err) => {
        const key = err.rowIndex >= 0 ? `Row ${err.rowIndex + 1}` : "Structure";
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(
          `- ${err.field}: ${err.message} (received: ${JSON.stringify(err.value)})`
        );
        return acc;
      },
      {} as Record<string, string[]>
    );

    // Format as readable text
    const formatted = Object.entries(grouped)
      .map(([key, msgs]) => `${key}:\n${msgs.join("\n")}`)
      .join("\n\n");

    return formatted;
  }

  /**
   * Validate a complete training plan using the full schema
   * This is a simpler validation that just checks if the plan matches the schema
   * @param plan - The plan to validate
   * @returns True if valid, throws if invalid
   */
  validateWithSchema(plan: unknown): TrainingPlan {
    return TrainingPlanSchema.parse(plan);
  }

  /**
   * Safe parse a training plan - returns success/error without throwing
   * @param plan - The plan to validate
   * @returns Safe parse result
   */
  safeValidateWithSchema(plan: unknown) {
    return TrainingPlanSchema.safeParse(plan);
  }

  /**
   * Helper to get nested value from object using path array
   */
  private getNestedValue(obj: unknown, path: PropertyKey[]): unknown {
    if (!obj || typeof obj !== "object") {
      return undefined;
    }
    let current: unknown = obj;
    for (const key of path) {
      if (current === null || current === undefined) {
        return undefined;
      }
      // Convert symbol to string for indexing, or use string/number directly
      const indexKey = typeof key === "symbol" ? key.toString() : key;
      current = (current as Record<string | number, unknown>)[indexKey];
    }
    return current;
  }
}

// Export singleton instance
export const pdfValidationService = new PdfValidationService();
