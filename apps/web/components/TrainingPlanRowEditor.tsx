"use client";

import { useState, useMemo, useEffect } from "react";
import type {
  TrainingPlanRow,
  WorkoutType,
  DayAbbreviation,
  HRZone,
  RowValidationError,
} from "@adaptive-training-plan/types";
import { AlertCircle, Check } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const WORKOUT_TYPES: WorkoutType[] = [
  "Easy",
  "Long",
  "Tempo",
  "Interval",
  "Recovery",
  "Rest",
  "Race",
  "Cross-Training",
  "Progression",
];

const DAYS: DayAbbreviation[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const HR_ZONES: HRZone[] = ["", "Z1", "Z2", "Z3", "Z4", "Z5"];

const DAY_INDEX_MAP: Record<number, DayAbbreviation> = {
  0: "Sun",
  1: "Mon",
  2: "Tue",
  3: "Wed",
  4: "Thu",
  5: "Fri",
  6: "Sat",
};

/**
 * Get the expected day abbreviation for a given date
 */
const getExpectedDayForDate = (dateStr: string): DayAbbreviation | null => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return null;
  }
  return DAY_INDEX_MAP[date.getUTCDay()];
};

/**
 * Validate a pace string format (e.g., "5:30-5:45" or "5:30")
 */
const isValidPaceFormat = (pace: string): boolean => {
  if (!pace) return true; // Empty is valid
  const pacePattern = /^(\d{1,2}:\d{2}(-\d{1,2}:\d{2})?(\/km)?)?$/;
  return pacePattern.test(pace);
};

/**
 * Validate a training plan row and return errors
 */
const validateRow = (rowData: TrainingPlanRow): RowValidationError[] => {
  const errors: RowValidationError[] = [];

  // Date format validation
  if (!rowData.date || !/^\d{4}-\d{2}-\d{2}$/.test(rowData.date)) {
    errors.push({ field: "date", message: "Date must be in YYYY-MM-DD format" });
  } else {
    // Day/date match validation
    const expectedDay = getExpectedDayForDate(rowData.date);
    if (expectedDay && rowData.day !== expectedDay) {
      errors.push({
        field: "day",
        message: `Day should be "${expectedDay}" for date ${rowData.date}`,
      });
    }
  }

  // Rest day distance validation
  if (rowData.type === "Rest" && rowData.planned_distance_km > 0) {
    errors.push({
      field: "planned_distance_km",
      message: "Rest days should have 0 distance",
    });
  }

  // Pace format validation
  if (!isValidPaceFormat(rowData.target_pace_min_per_km)) {
    errors.push({
      field: "target_pace_min_per_km",
      message: "Pace must be in format like '5:30-5:45' or '5:30'",
    });
  }

  // Distance range validation
  if (rowData.planned_distance_km < 0 || rowData.planned_distance_km > 100) {
    errors.push({
      field: "planned_distance_km",
      message: "Distance must be between 0 and 100 km",
    });
  }

  return errors;
};

interface TrainingPlanRowEditorProps {
  row: Partial<TrainingPlanRow>;
  rowIndex: number;
  errors: RowValidationError[];
  onChange: (updatedRow: TrainingPlanRow) => void;
  onValidationChange: (rowIndex: number, isValid: boolean) => void;
}

export const TrainingPlanRowEditor = ({
  row,
  rowIndex,
  onChange,
  onValidationChange,
}: TrainingPlanRowEditorProps) => {
  const [localRow, setLocalRow] = useState<TrainingPlanRow>({
    date: row.date || "",
    day: row.day || "Mon",
    type: row.type || "Easy",
    planned_distance_km: row.planned_distance_km || 0,
    target_pace_min_per_km: row.target_pace_min_per_km || "",
    target_HR_zone: row.target_HR_zone || "",
    notes: row.notes || "",
  });

  // Compute validation errors using useMemo instead of useEffect + setState
  const localErrors = useMemo(() => validateRow(localRow), [localRow]);

  const isValid = localErrors.length === 0;

  // Notify parent of validation state changes
  useEffect(() => {
    onValidationChange(rowIndex, isValid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowIndex, isValid]);

  // Update parent when row changes and is valid
  useEffect(() => {
    if (isValid) {
      onChange(localRow);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localRow, isValid]);

  const getFieldError = (field: string): string | undefined => {
    return localErrors.find((e) => e.field === field)?.message;
  };

  const hasFieldError = (field: string): boolean => {
    return localErrors.some((e) => e.field === field);
  };

  const handleDateChange = (value: string) => {
    const newRow = { ...localRow, date: value };

    // Auto-update day when date changes
    const expectedDay = getExpectedDayForDate(value);
    if (expectedDay) {
      newRow.day = expectedDay;
    }

    setLocalRow(newRow);
  };

  const handleTypeChange = (type: WorkoutType) => {
    const newRow = { ...localRow, type };

    // Auto-set distance to 0 for Rest days
    if (type === "Rest") {
      newRow.planned_distance_km = 0;
      newRow.target_pace_min_per_km = "";
      newRow.target_HR_zone = "";
    }

    setLocalRow(newRow);
  };

  return (
    <div
      className={cn(
        "p-4 rounded-lg border space-y-4",
        isValid ? "border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20" : "border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-900/20"
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Row {rowIndex + 1}</span>
        {isValid ? (
          <span className="flex items-center text-xs text-green-600 dark:text-green-400">
            <Check className="w-3 h-3 mr-1" /> Valid
          </span>
        ) : (
          <span className="flex items-center text-xs text-red-600 dark:text-red-400">
            <AlertCircle className="w-3 h-3 mr-1" /> {localErrors.length} error(s)
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {/* Date */}
        <div className="space-y-1">
          <Label htmlFor={`date-${rowIndex}`} className="text-xs">
            Date
          </Label>
          <Input
            id={`date-${rowIndex}`}
            type="date"
            value={localRow.date}
            onChange={(e) => handleDateChange(e.target.value)}
            className={cn(
              "text-xs h-8",
              hasFieldError("date") && "border-red-500"
            )}
          />
          {hasFieldError("date") && (
            <p className="text-xs text-red-500">{getFieldError("date")}</p>
          )}
        </div>

        {/* Day */}
        <div className="space-y-1">
          <Label htmlFor={`day-${rowIndex}`} className="text-xs">
            Day
          </Label>
          <Select
            value={localRow.day}
            onValueChange={(value) =>
              setLocalRow({ ...localRow, day: value as DayAbbreviation })
            }
          >
            <SelectTrigger
              id={`day-${rowIndex}`}
              className={cn(
                "text-xs h-8",
                hasFieldError("day") && "border-red-500"
              )}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DAYS.map((day) => (
                <SelectItem key={day} value={day} className="text-xs">
                  {day}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFieldError("day") && (
            <p className="text-xs text-red-500">{getFieldError("day")}</p>
          )}
        </div>

        {/* Type */}
        <div className="space-y-1">
          <Label htmlFor={`type-${rowIndex}`} className="text-xs">
            Type
          </Label>
          <Select
            value={localRow.type}
            onValueChange={(value) => handleTypeChange(value as WorkoutType)}
          >
            <SelectTrigger id={`type-${rowIndex}`} className="text-xs h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WORKOUT_TYPES.map((type) => (
                <SelectItem key={type} value={type} className="text-xs">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Distance */}
        <div className="space-y-1">
          <Label htmlFor={`distance-${rowIndex}`} className="text-xs">
            Distance (km)
          </Label>
          <Input
            id={`distance-${rowIndex}`}
            type="number"
            step="0.1"
            min="0"
            max="100"
            value={localRow.planned_distance_km}
            onChange={(e) =>
              setLocalRow({
                ...localRow,
                planned_distance_km: parseFloat(e.target.value) || 0,
              })
            }
            disabled={localRow.type === "Rest"}
            className={cn(
              "text-xs h-8",
              hasFieldError("planned_distance_km") && "border-red-500"
            )}
          />
          {hasFieldError("planned_distance_km") && (
            <p className="text-xs text-red-500">
              {getFieldError("planned_distance_km")}
            </p>
          )}
        </div>

        {/* Pace */}
        <div className="space-y-1">
          <Label htmlFor={`pace-${rowIndex}`} className="text-xs">
            Pace (min/km)
          </Label>
          <Input
            id={`pace-${rowIndex}`}
            type="text"
            placeholder="5:30-5:45"
            value={localRow.target_pace_min_per_km}
            onChange={(e) =>
              setLocalRow({ ...localRow, target_pace_min_per_km: e.target.value })
            }
            disabled={localRow.type === "Rest"}
            className={cn(
              "text-xs h-8",
              hasFieldError("target_pace_min_per_km") && "border-red-500"
            )}
          />
          {hasFieldError("target_pace_min_per_km") && (
            <p className="text-xs text-red-500">
              {getFieldError("target_pace_min_per_km")}
            </p>
          )}
        </div>

        {/* HR Zone */}
        <div className="space-y-1">
          <Label htmlFor={`hrzone-${rowIndex}`} className="text-xs">
            HR Zone
          </Label>
          <Select
            value={localRow.target_HR_zone}
            onValueChange={(value) =>
              setLocalRow({ ...localRow, target_HR_zone: value as HRZone })
            }
            disabled={localRow.type === "Rest"}
          >
            <SelectTrigger id={`hrzone-${rowIndex}`} className="text-xs h-8">
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              {HR_ZONES.map((zone) => (
                <SelectItem key={zone || "none"} value={zone} className="text-xs">
                  {zone || "None"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Notes */}
        <div className="space-y-1 col-span-2">
          <Label htmlFor={`notes-${rowIndex}`} className="text-xs">
            Notes
          </Label>
          <Input
            id={`notes-${rowIndex}`}
            type="text"
            value={localRow.notes}
            onChange={(e) => setLocalRow({ ...localRow, notes: e.target.value })}
            maxLength={500}
            className="text-xs h-8"
          />
        </div>
      </div>
    </div>
  );
};
