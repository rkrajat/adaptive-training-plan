"use client";

import type { RaceDistance } from "@adaptive-training-plan/types";
import {
  RACE_DISTANCES,
  RACE_DISTANCE_LABELS,
} from "@adaptive-training-plan/types";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RaceDistanceSelectProps {
  value: RaceDistance | undefined;
  onChange: (distance: RaceDistance) => void;
  disabled?: boolean;
}

export const RaceDistanceSelect = ({
  value,
  onChange,
  disabled = false,
}: RaceDistanceSelectProps) => {
  const handleChange = (val: string) => {
    onChange(Number(val) as RaceDistance);
  };

  return (
    <Select
      value={value?.toString()}
      onValueChange={handleChange}
      disabled={disabled}
    >
      <SelectTrigger className="text-xs sm:text-sm">
        <SelectValue placeholder="Select race distance" />
      </SelectTrigger>
      <SelectContent>
        {RACE_DISTANCES.map((distance) => (
          <SelectItem key={distance} value={distance.toString()}>
            {RACE_DISTANCE_LABELS[distance]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};
