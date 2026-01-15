import { z } from "zod";

/**
 * Query parameters validation schema for weekly summary endpoint
 * Validates startDate format and week number
 * Accepts both YYYY-MM-DD and full ISO date strings, transforms to YYYY-MM-DD
 */
export const weeklySummaryQuerySchema = z.object({
  startDate: z
    .string()
    .min(1, "Start date is required")
    .transform((val) => {
      // Extract YYYY-MM-DD from ISO string or use as-is if already in correct format
      const dateMatch = val.match(/^(\d{4}-\d{2}-\d{2})/);
      return dateMatch ? dateMatch[1] : val;
    })
    .refine(
      (val) => /^\d{4}-\d{2}-\d{2}$/.test(val),
      "Invalid date format. Use YYYY-MM-DD"
    ),
  week: z.coerce
    .number()
    .int("Week must be an integer")
    .positive("Week must be a positive integer"),
});

/**
 * Inferred TypeScript type from the schema
 */
export type WeeklySummaryQuery = z.infer<typeof weeklySummaryQuerySchema>;
