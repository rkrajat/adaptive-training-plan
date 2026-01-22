"use client";

import {
  Activity,
  Clock,
  Footprints,
  Route,
  Timer,
  TrendingUp,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useWeeklySummary } from "@/hooks/use-weekly-summary";

interface WeeklyRunsReportProps {
  currentWeek: number;
  startDate: string;
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
}

/**
 * Individual stat item within the weekly report
 */
const StatItem = ({ icon, label, value, subValue }: StatItemProps) => (
  <div className="flex flex-col">
    <div className="flex items-center gap-2 text-muted-foreground mb-1">
      {icon}
      <span className="text-xs font-medium">{label}</span>
    </div>
    <div className="text-lg font-bold">{value}</div>
    {subValue && <div className="text-xs text-muted-foreground">{subValue}</div>}
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
  const formatOptions: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString("en-US", formatOptions)} - ${end.toLocaleDateString("en-US", formatOptions)}`;
};

/**
 * Loading skeleton for the weekly runs report
 */
const WeeklyRunsReportSkeleton = () => (
  <Card className="mb-6">
    <CardHeader className="pb-2">
      <Skeleton className="h-5 w-40" />
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="flex flex-col gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-16" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

/**
 * Empty state when no runs exist for the week
 */
const EmptyState = ({ weekRange }: { weekRange: string }) => (
  <Card className="mb-6 border-dashed">
    <CardContent className="py-6">
      <div className="flex flex-col items-center justify-center text-center">
        <Footprints className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          No runs recorded for {weekRange}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Your weekly stats will appear here once you sync activities from Strava
        </p>
      </div>
    </CardContent>
  </Card>
);

/**
 * Weekly Runs Report Component
 * Displays aggregated running statistics for the current training week
 */
export const WeeklyRunsReport = ({
  currentWeek,
  startDate,
}: WeeklyRunsReportProps) => {
  const { data, isLoading, error } = useWeeklySummary({
    startDate,
    currentWeek,
  });

  if (isLoading) {
    return <WeeklyRunsReportSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-6">
        <AlertDescription>
          Failed to load weekly summary. Please try again later.
        </AlertDescription>
      </Alert>
    );
  }

  if (!data) {
    return null;
  }

  const weekRange = formatDateRange(data.weekStartDate, data.weekEndDate);

  // Show empty state if no runs
  if (data.numberOfRuns === 0) {
    return <EmptyState weekRange={weekRange} />;
  }

  return (
    <Card className="mb-6 border-orange-200 bg-orange-50/30 dark:border-orange-800 dark:bg-orange-950/20" data-tour="weekly-runs-report">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-orange-600" />
          <span>Week {currentWeek} Summary</span>
          <span className="text-xs font-normal text-muted-foreground">
            ({weekRange})
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
          <StatItem
            icon={<TrendingUp className="h-4 w-4 text-rose-500" />}
            label="Longest Run"
            value={formatDistance(data.longestRun)}
          />
        </div>
      </CardContent>
    </Card>
  );
};
