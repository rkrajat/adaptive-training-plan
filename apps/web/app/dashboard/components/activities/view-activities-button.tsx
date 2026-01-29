import { Activity } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ViewActivitiesButtonProps {
  activityCount: number;
  onClick: () => void;
}

/**
 * Button to open the activities dialog
 * Features orange accent styling to match WeeklyRunsReport
 */
export const ViewActivitiesButton = ({
  activityCount,
  onClick,
}: ViewActivitiesButtonProps) => {
  return (
    <div className="mb-6" data-tour="recent-activities">
      <Button
        variant="outline"
        onClick={onClick}
        className="
          w-full sm:w-auto
          border-orange-200 text-orange-700 hover:bg-orange-50
          dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950/30
          transition-colors
        "
      >
        <Activity className="h-4 w-4 mr-2" />
        See your recent activities
        {activityCount > 0 && (
          <Badge
            variant="secondary"
            className="ml-2 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
          >
            {activityCount}
          </Badge>
        )}
      </Button>
    </div>
  );
};
