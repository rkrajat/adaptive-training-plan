import { Heart, Route, Timer, Gauge } from "lucide-react";

import type { Activity } from "@adaptive-training-plan/types";

import { Badge } from "@/components/ui/badge";
import { formatDuration } from "@/lib/activity-formatters";

interface ActivityListItemProps {
  activity: Activity;
}

/**
 * Calculate pace from distance and time
 * @param distanceMeters - Distance in meters
 * @param timeSeconds - Time in seconds
 * @returns Pace string in min:ss/km format
 */
const formatPace = (distanceMeters: number, timeSeconds: number): string => {
  if (!distanceMeters || !timeSeconds) {
    return "-";
  }
  const distanceKm = distanceMeters / 1000;
  const paceSecondsPerKm = timeSeconds / distanceKm;
  const minutes = Math.floor(paceSecondsPerKm / 60);
  const seconds = Math.round(paceSecondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}/km`;
};

/**
 * List item component for displaying activity in a two-line layout
 * Line 1: Activity name (truncated) + type badge
 * Line 2: Distance, duration, pace, heart rate (with icons)
 */
export const ActivityListItem = ({ activity }: ActivityListItemProps) => {
  const distanceKm = (activity.distance / 1000).toFixed(1);
  const duration = formatDuration(activity.movingTime);
  const pace = formatPace(activity.distance, activity.movingTime);

  return (
    <div className="flex flex-col gap-1.5 py-3 px-2 border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors">
      {/* Line 1: Name and type badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm text-foreground truncate flex-1">
          {activity.name}
        </span>
        <Badge variant="secondary" className="text-xs shrink-0">
          {activity.type}
        </Badge>
      </div>

      {/* Line 2: Stats with icons */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Route className="h-3.5 w-3.5" />
          {distanceKm} km
        </span>
        <span className="flex items-center gap-1">
          <Timer className="h-3.5 w-3.5" />
          {duration}
        </span>
        <span className="flex items-center gap-1">
          <Gauge className="h-3.5 w-3.5" />
          {pace}
        </span>
        {activity.averageHeartrate && (
          <span className="flex items-center gap-1">
            <Heart className="h-3.5 w-3.5 text-red-500" />
            {Math.round(activity.averageHeartrate)}
          </span>
        )}
      </div>
    </div>
  );
};
