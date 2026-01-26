"use client";

import { useMemo } from "react";
import type { RaceDistance } from "@adaptive-training-plan/types";
import { TIME_MINIMUMS, TIME_MAXIMUMS } from "@adaptive-training-plan/types";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimeTargetInputProps {
  hours: number;
  minutes: number;
  seconds: number;
  onHoursChange: (hours: number) => void;
  onMinutesChange: (minutes: number) => void;
  onSecondsChange: (seconds: number) => void;
  distance: RaceDistance | undefined;
  disabled?: boolean;
}

/**
 * Format seconds to human-readable time string
 */
const formatTime = (totalSeconds: number): string => {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  if (hrs > 0) {
    return `${hrs}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

export const TimeTargetInput = ({
  hours,
  minutes,
  seconds,
  onHoursChange,
  onMinutesChange,
  onSecondsChange,
  distance,
  disabled = false,
}: TimeTargetInputProps) => {
  // Generate options arrays
  const hourOptions = useMemo(() => {
    const opts = [];
    for (let idx = 0; idx <= 6; idx++) {
      opts.push(idx);
    }
    return opts;
  }, []);

  const minuteOptions = useMemo(() => {
    const opts = [];
    for (let idx = 0; idx <= 59; idx++) {
      opts.push(idx);
    }
    return opts;
  }, []);

  const secondOptions = useMemo(() => {
    const opts = [];
    for (let idx = 0; idx <= 59; idx++) {
      opts.push(idx);
    }
    return opts;
  }, []);

  // Calculate current total seconds
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  // Get validation bounds
  const minTime = distance ? TIME_MINIMUMS[distance] : undefined;
  const maxTime = distance ? TIME_MAXIMUMS[distance] : undefined;

  // Validation status
  const isValid =
    !distance ||
    (totalSeconds >= (minTime ?? 0) && totalSeconds <= (maxTime ?? Infinity));
  const isBelowMinimum =
    distance && minTime !== undefined && totalSeconds < minTime && totalSeconds > 0;
  const isAboveMaximum =
    distance && maxTime !== undefined && totalSeconds > maxTime;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 sm:gap-2">
        {/* Hours */}
        <div className="flex-1 min-w-0">
          <Select
            value={hours.toString()}
            onValueChange={(val) => onHoursChange(Number(val))}
            disabled={disabled}
          >
            <SelectTrigger className="text-xs sm:text-sm">
              <SelectValue placeholder="HH" />
            </SelectTrigger>
            <SelectContent>
              {hourOptions.map((hour) => (
                <SelectItem key={hour} value={hour.toString()}>
                  {hour}h
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span className="text-muted-foreground">:</span>

        {/* Minutes */}
        <div className="flex-1 min-w-0">
          <Select
            value={minutes.toString()}
            onValueChange={(val) => onMinutesChange(Number(val))}
            disabled={disabled}
          >
            <SelectTrigger className="text-xs sm:text-sm">
              <SelectValue placeholder="MM" />
            </SelectTrigger>
            <SelectContent>
              {minuteOptions.map((min) => (
                <SelectItem key={min} value={min.toString()}>
                  {String(min).padStart(2, "0")}m
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <span className="text-muted-foreground">:</span>

        {/* Seconds */}
        <div className="flex-1 min-w-0">
          <Select
            value={seconds.toString()}
            onValueChange={(val) => onSecondsChange(Number(val))}
            disabled={disabled}
          >
            <SelectTrigger className="text-xs sm:text-sm">
              <SelectValue placeholder="SS" />
            </SelectTrigger>
            <SelectContent>
              {secondOptions.map((sec) => (
                <SelectItem key={sec} value={sec.toString()}>
                  {String(sec).padStart(2, "0")}s
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Validation messages */}
      {isBelowMinimum && minTime !== undefined && (
        <p className="text-xs text-destructive">
          Minimum time for this distance is {formatTime(minTime)} (world record)
        </p>
      )}
      {isAboveMaximum && maxTime !== undefined && (
        <p className="text-xs text-destructive">
          Maximum time for this distance is {formatTime(maxTime)} (race cutoff)
        </p>
      )}
      {totalSeconds > 0 && isValid && (
        <p className="text-xs text-muted-foreground">
          Target time: {formatTime(totalSeconds)}
        </p>
      )}
    </div>
  );
};
