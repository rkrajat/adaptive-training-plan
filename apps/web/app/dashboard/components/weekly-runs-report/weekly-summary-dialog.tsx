"use client";

import { useState, useEffect } from "react";
import {
  Activity,
  ArrowLeft,
  Clock,
  Eye,
  Footprints,
  Gauge,
  Route,
  Timer,
  TrendingUp,
} from "lucide-react";

import type {
  Activity as ActivityType,
  RaceGoal,
} from "@adaptive-training-plan/types";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWeeklySummary } from "@/hooks/use-weekly-summary";
import { cn } from "@/lib/utils";
import { TrainingPacesContent } from "@/components/training-paces-dialog";
import { ActivitiesContent } from "../activities";

type DialogView = "summary" | "activities" | "training-paces";

interface WeeklySummaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWeek: number;
  startDate: string;
  activities: ActivityType[];
  raceGoal?: RaceGoal;
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}

/**
 * Individual stat item with bordered container
 */
const StatItem = ({ icon, label, value, subValue }: StatItemProps) => (
  <div className="rounded-lg border p-3 bg-muted/30">
    <div className="flex items-center gap-2 text-muted-foreground mb-1">
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
    <div className="text-lg font-bold">{value}</div>
    {subValue && (
      <div className="text-xs text-muted-foreground">{subValue}</div>
    )}
  </div>
);

/**
 * Format distance from meters to kilometers with one decimal
 */
const formatDistance = (meters: number): string => {
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
};

/**
 * Format pace from seconds per km to min:sec per km
 */
const formatPace = (secondsPerKm: number): string => {
  if (secondsPerKm === 0) return "-";
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")} /km`;
};

/**
 * Format time from seconds to hours and minutes
 */
const formatTime = (seconds: number): string => {
  if (seconds === 0) return "-";
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes} min`;
};

/**
 * Format date range for display
 */
const formatDateRange = (startDate: string, endDate: string): string => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const formatOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  return `${start.toLocaleDateString("en-US", formatOptions)} - ${end.toLocaleDateString("en-US", formatOptions)}`;
};

/**
 * Loading skeleton for the weekly summary dialog
 */
const WeeklySummaryDialogSkeleton = () => (
  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
    {Array.from({ length: 5 }).map((_, idx) => (
      <div
        key={idx}
        className={`rounded-lg border p-3 bg-muted/30 ${idx === 4 ? "col-span-2 sm:col-span-1" : ""}`}
      >
        <div className="flex items-center gap-2 mb-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-6 w-20" />
      </div>
    ))}
  </div>
);

/**
 * Back button header for child views
 */
const ViewHeader = ({
  title,
  onBack,
}: {
  title: string;
  onBack: () => void;
}) => (
  <div className="flex items-center gap-2 mb-4">
    <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
      <ArrowLeft className="h-4 w-4" />
      <span className="sr-only">Back</span>
    </Button>
    <span className="font-semibold">{title}</span>
  </div>
);

/**
 * Weekly Summary Dialog Component
 * Multi-step dialog with animated transitions between summary, activities, and training paces views
 */
export const WeeklySummaryDialog = ({
  open,
  onOpenChange,
  currentWeek,
  startDate,
  activities,
  raceGoal,
}: WeeklySummaryDialogProps) => {
  const [currentView, setCurrentView] = useState<DialogView>("summary");

  const { data, isLoading, error } = useWeeklySummary({
    startDate,
    currentWeek,
    enabled: open,
  });

  // Reset view when dialog closes
  useEffect(() => {
    if (!open) {
      // Small delay to allow closing animation before resetting
      const timer = setTimeout(() => {
        setCurrentView("summary");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const weekRange = data
    ? formatDateRange(data.weekStartDate, data.weekEndDate)
    : "";

  const handleViewActivities = () => {
    setCurrentView("activities");
  };

  const handleViewTrainingPaces = () => {
    setCurrentView("training-paces");
  };

  const handleBack = () => {
    setCurrentView("summary");
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md overflow-hidden">
        {/* Header - only shown for summary view */}
        {currentView === "summary" && (
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-orange-600" />
              Week {currentWeek} Summary
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {weekRange
                ? `Your running stats for ${weekRange}`
                : "Loading your weekly stats..."}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
        )}

        {/* Sliding content container */}
        <div className="relative overflow-hidden">
          <div
            className={cn(
              "flex transition-transform duration-300 ease-in-out",
              currentView === "summary" && "translate-x-0",
              currentView === "activities" && "-translate-x-full",
              currentView === "training-paces" && "-translate-x-[200%]",
            )}
          >
            {/* Summary Panel */}
            <div className="w-full flex-shrink-0">
              <div>
                {isLoading && <WeeklySummaryDialogSkeleton />}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      Failed to load weekly summary. Please try again later.
                    </AlertDescription>
                  </Alert>
                )}

                {data && data.numberOfRuns === 0 && (
                  <div className="flex flex-col items-center justify-center text-center py-6">
                    <Footprints className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No runs recorded for {weekRange}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Your weekly stats will appear here once you sync
                      activities from Strava
                    </p>
                  </div>
                )}

                {data && data.numberOfRuns > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <StatItem
                      icon={<Route className="h-4 w-4 text-blue-500" />}
                      label="Total Distance"
                      value={formatDistance(data.totalDistance)}
                    />
                    <StatItem
                      icon={<Footprints className="h-4 w-4 text-green-500" />}
                      label="Runs"
                      value={data.numberOfRuns.toString()}
                    />
                    <StatItem
                      icon={<Timer className="h-4 w-4 text-purple-500" />}
                      label="Avg Pace"
                      value={formatPace(data.averagePace)}
                    />
                    <StatItem
                      icon={<Clock className="h-4 w-4 text-amber-500" />}
                      label="Total Time"
                      value={formatTime(data.totalTime)}
                    />
                    <div className="col-span-2 sm:col-span-1">
                      <StatItem
                        icon={<TrendingUp className="h-4 w-4 text-rose-500" />}
                        label="Longest Run"
                        value={formatDistance(data.longestRun)}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Activities Panel */}
            <div className="w-full flex-shrink-0">
              <ViewHeader title="View 30 Days Activities" onBack={handleBack} />
              <div className="max-h-[400px] overflow-y-auto -mx-2 px-2">
                <ActivitiesContent activities={activities} />
              </div>
            </div>

            {/* Training Paces Panel */}
            <div className="w-full flex-shrink-0">
              <ViewHeader title="Training Paces" onBack={handleBack} />
              {raceGoal && <TrainingPacesContent raceGoal={raceGoal} />}
            </div>
          </div>
        </div>

        {/* Footer - only shown for summary view */}
        {currentView === "summary" && (
          <ResponsiveDialogFooter className="flex-col gap-2 sm:flex-row">
            {raceGoal && (
              <Button
                variant="outline"
                onClick={handleViewTrainingPaces}
                className="w-full sm:w-auto border-indigo-200 text-indigo-600 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-400 dark:hover:bg-indigo-950/50"
              >
                <Gauge className="h-4 w-4 mr-2" />
                Training Paces
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleViewActivities}
              className="w-full sm:w-auto border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-950/50"
            >
              <Eye className="h-4 w-4 mr-2" />
              View 30 Days Activities
            </Button>
          </ResponsiveDialogFooter>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};
