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
          <h3 className="font-semibold text-gray-900 text-sm truncate">
            {activity.name}
          </h3>
          <p className="text-xs text-gray-600">{activity.type}</p>
        </div>
        {activity.averageHeartrate && (
          <div className="ml-2 flex items-center gap-1 text-xs">
            <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
            <span className="font-medium text-gray-900">
              {Math.round(activity.averageHeartrate)}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between">
          <span className="text-gray-600">Distance</span>
          <span className="font-medium text-gray-900">
            {(activity.distance / 1000).toFixed(2)} km
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Duration</span>
          <span className="font-medium text-gray-900">
            {formatDuration(activity.movingTime)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Date</span>
          <span className="font-medium text-gray-900">
            {formatDate(activity.startDate)}
          </span>
        </div>
      </div>
    </Card>
  );
};
