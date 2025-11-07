import { Archive } from "lucide-react";

import type { Activity } from "@adaptive-training-plan/types";

import { Card } from "@/components/ui/card";

import { ActivityCard } from "./activity-card";

interface RecentActivitiesProps {
  activities: Activity[];
}

/**
 * Section component to display recent activities with empty state
 */
export const RecentActivities = ({ activities }: RecentActivitiesProps) => {
  return (
    <div className="mb-6 sm:mb-8">
      <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
        Recent Activities
      </h2>

      {activities.length === 0 ? (
        <Card className="p-6 sm:p-12 text-center">
          <Archive className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
          <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold">No activities found</h3>
          <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
            You haven&apos;t logged any activities in the last 30 days.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
};
