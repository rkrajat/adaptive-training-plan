import { Heart } from "lucide-react";

import type { Activity } from "@adaptive-training-plan/types";

import { Card } from "@/components/ui/card";
import { formatDate, formatDuration } from "@/lib/activity-formatters";

interface ActivityCardProps {
  activity: Activity;
}

/**
 * Card component to display a single activity with its details
 */
export const ActivityCard = ({ activity }: ActivityCardProps) => {
  return (
    <Card className="p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground text-sm truncate">
            {activity.name}
          </h3>
          <p className="text-xs text-muted-foreground">{activity.type}</p>
        </div>
        {activity.averageHeartrate && (
          <div className="ml-2 flex items-center gap-1 text-xs">
            <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
            <span className="font-medium text-foreground">
              {Math.round(activity.averageHeartrate)}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Distance</span>
          <span className="font-medium text-foreground">
            {(activity.distance / 1000).toFixed(2)} km
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Duration</span>
          <span className="font-medium text-foreground">
            {formatDuration(activity.movingTime)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Date</span>
          <span className="font-medium text-foreground">
            {formatDate(activity.startDate)}
          </span>
        </div>
      </div>
    </Card>
  );
};
