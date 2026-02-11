"use client";

import { useMemo } from "react";
import { Archive } from "lucide-react";

import type { Activity } from "@adaptive-training-plan/types";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMediaQuery } from "@/hooks/use-media-query";
import { cn } from "@/lib/utils";

import { ActivityListItem } from "./activity-list-item";

interface ActivitiesDialogProps {
  activities: Activity[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface WeekGroup {
  weekLabel: string;
  weekKey: string;
  dateRange: string;
  activities: Activity[];
  isCurrentWeek: boolean;
}

/**
 * Get the Monday of the week for a given date
 */
const getWeekStart = (date: Date): Date => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(date);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
};

/**
 * Format date range for display
 */
const formatDateRange = (startDate: Date, endDate: Date): string => {
  const formatOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  return `${startDate.toLocaleDateString("en-US", formatOptions)} - ${endDate.toLocaleDateString("en-US", formatOptions)}`;
};

/**
 * Group activities by week
 */
const groupActivitiesByWeek = (activities: Activity[]): WeekGroup[] => {
  if (activities.length === 0) return [];

  const today = new Date();
  const currentWeekStart = getWeekStart(today);

  // Group activities by week start date
  const weekMap = new Map<string, Activity[]>();

  activities.forEach((activity) => {
    const activityDate = new Date(activity.startDate);
    const weekStart = getWeekStart(activityDate);
    const weekKey = weekStart.toISOString();

    if (!weekMap.has(weekKey)) {
      weekMap.set(weekKey, []);
    }
    weekMap.get(weekKey)!.push(activity);
  });

  // Convert to sorted array (most recent first)
  const sortedWeeks = Array.from(weekMap.entries())
    .sort(
      ([keyA], [keyB]) => new Date(keyB).getTime() - new Date(keyA).getTime(),
    )
    .map(([weekKey, weekActivities], index) => {
      const weekStart = new Date(weekKey);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);

      const isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();

      // Sort activities within week by date (most recent first)
      const sortedActivities = [...weekActivities].sort(
        (actA, actB) =>
          new Date(actB.startDate).getTime() -
          new Date(actA.startDate).getTime(),
      );

      return {
        weekKey: `week-${index}`,
        weekLabel: isCurrentWeek ? "This Week" : `Week`,
        dateRange: formatDateRange(weekStart, weekEnd),
        activities: sortedActivities,
        isCurrentWeek,
      };
    });

  return sortedWeeks;
};

/**
 * Empty state component when no activities exist
 */
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <Archive className="h-12 w-12 text-muted-foreground mb-4" />
    <h3 className="text-lg font-semibold text-foreground">
      No activities found
    </h3>
    <p className="text-sm text-muted-foreground mt-2">
      You haven&apos;t logged any activities in the last 30 days.
    </p>
  </div>
);

/**
 * Activity list for a single week
 */
const WeekActivityList = ({ activities }: { activities: Activity[] }) => (
  <div className="pb-2">
    {activities.map((activity) => (
      <ActivityListItem key={activity.id} activity={activity} />
    ))}
  </div>
);

/**
 * Tabbed activity list content shared between Dialog and Drawer
 * Also exported as ActivitiesContent for embedding in other dialogs
 */
export const ActivitiesContent = ({
  activities,
}: {
  activities: Activity[];
}) => {
  const weekGroups = useMemo(
    () => groupActivitiesByWeek(activities),
    [activities],
  );

  if (activities.length === 0) {
    return <EmptyState />;
  }

  // If only one week, show without tabs
  if (weekGroups.length === 1) {
    return <WeekActivityList activities={weekGroups[0].activities} />;
  }

  // Find the current week or default to first
  const defaultWeek =
    weekGroups.find((week) => week.isCurrentWeek)?.weekKey ||
    weekGroups[0].weekKey;

  return (
    <Tabs defaultValue={defaultWeek} className="w-full">
      <div className="overflow-x-auto pb-2 -mx-1 px-1">
        <TabsList className="inline-flex h-auto min-w-full gap-1 bg-muted/50 p-1">
          {weekGroups.map((week) => (
            <TabsTrigger
              key={week.weekKey}
              value={week.weekKey}
              className={cn(
                "min-w-[80px] px-3 py-1.5 text-xs font-medium transition-all flex flex-col gap-0.5",
                "data-[state=active]:shadow-sm",
                week.isCurrentWeek &&
                  "data-[state=active]:bg-orange-500 data-[state=active]:text-white",
                week.isCurrentWeek &&
                  "data-[state=inactive]:bg-orange-100 data-[state=inactive]:text-orange-700 dark:data-[state=inactive]:bg-orange-950/50 dark:data-[state=inactive]:text-orange-400",
              )}
            >
              <span className="font-medium">{week.weekLabel}</span>
              <span className="text-[10px] opacity-80">{week.dateRange}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {weekGroups.map((week) => (
        <TabsContent key={week.weekKey} value={week.weekKey} className="mt-2">
          <div
            className={cn(
              "rounded-lg border min-h-[320px] max-h-[320px] overflow-y-auto",
              week.isCurrentWeek
                ? "border-orange-200 dark:border-orange-800"
                : "border-border",
            )}
          >
            <WeekActivityList activities={week.activities} />
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {week.activities.length}{" "}
            {week.activities.length === 1 ? "activity" : "activities"}
          </p>
        </TabsContent>
      ))}
    </Tabs>
  );
};

/**
 * Responsive dialog/drawer for displaying recent Strava activities
 * Uses Drawer (bottom sheet) on mobile, Dialog on desktop
 * Activities are grouped by week in tabs
 */
export const ActivitiesDialog = ({
  activities,
  open,
  onOpenChange,
}: ActivitiesDialogProps) => {
  const isMobile = useMediaQuery("(max-width: 767px)");

  const title = "Last 30 Days Activities";

  // Mobile: Use Drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-auto px-4 pb-6">
            <ActivitiesContent activities={activities} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop: Use Dialog
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 -mx-6 px-6">
          <ActivitiesContent activities={activities} />
        </div>
      </DialogContent>
    </Dialog>
  );
};
