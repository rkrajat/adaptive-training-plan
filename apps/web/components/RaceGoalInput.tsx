"use client";

import { useState, useEffect } from "react";
import type { RaceDistance, RaceGoalInput as RaceGoalInputType } from "@adaptive-training-plan/types";
import { TIME_MINIMUMS, TIME_MAXIMUMS } from "@adaptive-training-plan/types";

import { Label } from "@/components/ui/label";
import { RaceDistanceSelect } from "@/components/RaceDistanceSelect";
import { TimeTargetInput } from "@/components/TimeTargetInput";

interface RaceGoalInputProps {
  value: RaceGoalInputType | undefined;
  onChange: (raceGoal: RaceGoalInputType | undefined) => void;
  disabled?: boolean;
}

export const RaceGoalInput = ({
  value,
  onChange,
  disabled = false,
}: RaceGoalInputProps) => {
  const [distance, setDistance] = useState<RaceDistance | undefined>(value?.distance);
  const [hours, setHours] = useState(
    value ? Math.floor(value.targetTimeSeconds / 3600) : 0
  );
  const [minutes, setMinutes] = useState(
    value ? Math.floor((value.targetTimeSeconds % 3600) / 60) : 0
  );
  const [seconds, setSeconds] = useState(
    value ? value.targetTimeSeconds % 60 : 0
  );

  // Calculate total seconds
  const totalSeconds = hours * 3600 + minutes * 60 + seconds;

  // Validate time is within bounds
  const isValidTime = () => {
    if (!distance || totalSeconds === 0) return false;
    const minTime = TIME_MINIMUMS[distance];
    const maxTime = TIME_MAXIMUMS[distance];
    return totalSeconds >= minTime && totalSeconds <= maxTime;
  };

  // Update parent when values change
  useEffect(() => {
    if (distance && totalSeconds > 0 && isValidTime()) {
      onChange({
        distance,
        targetTimeSeconds: totalSeconds,
      });
    } else {
      onChange(undefined);
    }
  }, [distance, totalSeconds]);

  const handleDistanceChange = (newDistance: RaceDistance) => {
    setDistance(newDistance);
    // Reset time if it's no longer valid for new distance
    if (totalSeconds > 0) {
      const minTime = TIME_MINIMUMS[newDistance];
      const maxTime = TIME_MAXIMUMS[newDistance];
      if (totalSeconds < minTime || totalSeconds > maxTime) {
        // Set to a reasonable default based on distance
        const defaultTime = Math.round((minTime + maxTime) / 2);
        setHours(Math.floor(defaultTime / 3600));
        setMinutes(Math.floor((defaultTime % 3600) / 60));
        setSeconds(defaultTime % 60);
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Race Distance */}
      <div className="space-y-1.5">
        <Label className="text-xs sm:text-sm">
          Race Distance
          <span className="ml-1 text-orange-600">*</span>
        </Label>
        <RaceDistanceSelect
          value={distance}
          onChange={handleDistanceChange}
          disabled={disabled}
        />
      </div>

      {/* Target Time */}
      <div className="space-y-1.5">
        <Label className="text-xs sm:text-sm">
          Target Finish Time
          <span className="ml-1 text-orange-600">*</span>
        </Label>
        <TimeTargetInput
          hours={hours}
          minutes={minutes}
          seconds={seconds}
          onHoursChange={setHours}
          onMinutesChange={setMinutes}
          onSecondsChange={setSeconds}
          distance={distance}
          disabled={disabled}
        />
      </div>
    </div>
  );
};
