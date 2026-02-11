import { z } from "zod";

/**
 * Valid workout types for training plans
 */
export const WorkoutTypeEnum = z.enum([
  "Easy",
  "Long",
  "Tempo",
  "Interval",
  "Recovery",
  "Rest",
  "Race",
  "Cross-Training",
  "Progression",
]);

export type WorkoutType = z.infer<typeof WorkoutTypeEnum>;

/**
 * Valid day abbreviations
 */
export const DayEnum = z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);

export type Day = z.infer<typeof DayEnum>;

/**
 * Heart rate zone enum (Z1-Z5 or empty string for rest/cross-training)
 */
export const HRZoneEnum = z.enum(["Z1", "Z2", "Z3", "Z4", "Z5", ""]);

export type HRZone = z.infer<typeof HRZoneEnum>;

/**
 * Date format regex: YYYY-MM-DD
 */
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Pace range regex pattern: "5:30-5:45" or "5:30" or "5:30-5:45/km" or empty
 * Supports formats like:
 * - "5:30-5:45"
 * - "5:30-5:45/km"
 * - "5:30"
 * - ""
 */
const paceRangePattern = /^(\d{1,2}:\d{2}(-\d{1,2}:\d{2})?(\/km)?)?$/;

/**
 * Individual training plan row schema
 * Represents a single day's workout in the training plan
 */
export const TrainingPlanRowSchema = z.object({
  date: z.string().regex(datePattern, "Date must be in YYYY-MM-DD format"),
  day: DayEnum,
  type: WorkoutTypeEnum,
  planned_distance_km: z.number().min(0, "Distance cannot be negative").max(100, "Distance cannot exceed 100km"),
  target_pace_min_per_km: z
    .string()
    .regex(paceRangePattern, "Pace must be in format like '5:30-5:45' or '5:30-5:45/km' or empty")
    .nullable(),
  target_HR_zone: HRZoneEnum.nullable(),
  notes: z.string().max(300, "Notes cannot exceed 300 characters").nullable(),
});

export type TrainingPlanRow = z.infer<typeof TrainingPlanRowSchema>;

/**
 * Complete training plan schema - array of rows wrapped in object
 * This structure is required by generateObject() for proper schema validation
 */
export const TrainingPlanSchema = z.object({
  rows: z
    .array(TrainingPlanRowSchema)
    .min(1, "Training plan must have at least one row")
    .max(365, "Training plan cannot exceed 365 days"),
});

export type TrainingPlan = z.infer<typeof TrainingPlanSchema>;

/**
 * Map day index (0-6, Sunday=0) to day abbreviation
 */
export const dayIndexToAbbreviation: Record<number, Day> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

/**
 * Get expected day abbreviation for a given date string
 * @param dateStr - Date in YYYY-MM-DD format
 * @returns Expected day abbreviation or null if invalid date
 */
export const getExpectedDayForDate = (dateStr: string): Day | null => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return null;
  }
  return dayIndexToAbbreviation[date.getUTCDay()];
};
