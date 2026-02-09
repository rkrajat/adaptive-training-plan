"use client";

import { useState } from "react";
import {
  AlertCircle,
  Brain,
  Calendar,
  CheckCircle2,
  Clock,
  Footprints,
  Loader2,
  MessageSquare,
  Route,
  Sparkles,
  TrendingUp,
} from "lucide-react";

import type { WeeklySummaryData } from "@adaptive-training-plan/types";
import { Button } from "@/components/ui/button";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface PreRecommendationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weeklySummary?: WeeklySummaryData;
  currentWeek: number;
  onGenerate: (userFeedback?: string) => void;
  isLoading?: boolean;
}

/**
 * Format distance from meters to km
 */
const formatDistance = (meters: number): string => {
  const km = meters / 1000;
  return `${km.toFixed(1)} km`;
};

/**
 * Format pace from seconds per km to min:sec
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
 * Stat item for quick overview
 */
const QuickStat = ({
  icon,
  label,
  value,
  colorClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  colorClass: string;
}) => (
  <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
    <span className={colorClass}>{icon}</span>
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  </div>
);

/**
 * Observation item
 */
const Observation = ({
  icon,
  text,
  type = "info",
}: {
  icon: React.ReactNode;
  text: string;
  type?: "info" | "warning" | "success";
}) => {
  const colorClasses = {
    info: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300",
    warning:
      "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-300",
    success:
      "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-300",
  };

  return (
    <div
      className={cn(
        "flex items-start gap-2 p-2 rounded-lg border",
        colorClasses[type],
      )}
    >
      <span className="mt-0.5 flex-shrink-0">{icon}</span>
      <span className="text-xs leading-relaxed">{text}</span>
    </div>
  );
};

/**
 * Generate observations based on weekly data
 */
const generateObservations = (
  summary: WeeklySummaryData | undefined,
): Array<{
  icon: React.ReactNode;
  text: string;
  type: "info" | "warning" | "success";
}> => {
  const observations: Array<{
    icon: React.ReactNode;
    text: string;
    type: "info" | "warning" | "success";
  }> = [];

  if (!summary) {
    observations.push({
      icon: <AlertCircle className="h-3.5 w-3.5" />,
      text: "No activity data available for this week yet.",
      type: "info",
    });
    return observations;
  }

  // Number of runs observation
  if (summary.numberOfRuns === 0) {
    // Check if it's been at least 2 days into the week (user likely should have run by now)
    const weekStart = new Date(summary.weekStartDate);
    const today = new Date();
    const daysSinceWeekStart = Math.floor(
      (today.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysSinceWeekStart >= 2) {
      observations.push({
        icon: <AlertCircle className="h-3.5 w-3.5" />,
        text: "No runs recorded yet. The AI will analyze your planned vs actual training.",
        type: "warning",
      });
    } else {
      observations.push({
        icon: <Footprints className="h-3.5 w-3.5" />,
        text: "Week just started. No runs recorded yet.",
        type: "info",
      });
    }
  } else if (summary.numberOfRuns >= 3) {
    observations.push({
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      text: `Great consistency! ${summary.numberOfRuns} runs completed so far.`,
      type: "success",
    });
  } else {
    observations.push({
      icon: <Footprints className="h-3.5 w-3.5" />,
      text: `${summary.numberOfRuns} run${summary.numberOfRuns === 1 ? "" : "s"} completed this week.`,
      type: "info",
    });
  }

  // Distance observation
  if (summary.totalDistance > 30000) {
    observations.push({
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      text: `Strong volume with ${formatDistance(summary.totalDistance)} covered.`,
      type: "success",
    });
  } else if (summary.totalDistance > 0) {
    observations.push({
      icon: <Route className="h-3.5 w-3.5" />,
      text: `${formatDistance(summary.totalDistance)} total distance this week.`,
      type: "info",
    });
  }

  return observations;
};

/**
 * Pre-Recommendation Context Dialog
 * Shows summary of the week before generating AI recommendations
 */
export const PreRecommendationDialog = ({
  open,
  onOpenChange,
  weeklySummary,
  currentWeek,
  onGenerate,
  isLoading = false,
}: PreRecommendationDialogProps) => {
  const [userFeedback, setUserFeedback] = useState("");

  const observations = generateObservations(weeklySummary);

  const handleGenerate = () => {
    onGenerate(userFeedback.trim() || undefined);
    setUserFeedback("");
    onOpenChange(false);
  };

  const handleClose = () => {
    setUserFeedback("");
    onOpenChange(false);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={handleClose}>
      <ResponsiveDialogContent className="sm:max-w-lg">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Generate Training Recommendation
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Review your week before the AI generates personalized
            recommendations.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="space-y-4 py-4">
          {/* Your Week So Far */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              Week {currentWeek} So Far
            </h4>
            {weeklySummary && weeklySummary.numberOfRuns > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                <QuickStat
                  icon={<Route className="h-4 w-4" />}
                  label="Distance"
                  value={formatDistance(weeklySummary.totalDistance)}
                  colorClass="text-blue-500"
                />
                <QuickStat
                  icon={<Footprints className="h-4 w-4" />}
                  label="Runs"
                  value={weeklySummary.numberOfRuns.toString()}
                  colorClass="text-green-500"
                />
                <QuickStat
                  icon={<Clock className="h-4 w-4" />}
                  label="Time"
                  value={formatTime(weeklySummary.totalTime)}
                  colorClass="text-amber-500"
                />
                <QuickStat
                  icon={<TrendingUp className="h-4 w-4" />}
                  label="Avg Pace"
                  value={formatPace(weeklySummary.averagePace)}
                  colorClass="text-purple-500"
                />
              </div>
            ) : (
              <p className="text-xs text-muted-foreground p-3 bg-muted/50 rounded-lg">
                No runs recorded yet this week. The AI will help you adjust your
                plan.
              </p>
            )}
          </div>

          {/* Key Observations */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              Key Observations
            </h4>
            <div className="space-y-2">
              {observations.map((obs, idx) => (
                <Observation
                  key={idx}
                  icon={obs.icon}
                  text={obs.text}
                  type={obs.type}
                />
              ))}
            </div>
          </div>

          {/* What We're Considering */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-purple-600" />
              What the AI Considers
            </h4>
            <ul className="text-xs text-muted-foreground space-y-1 pl-4 list-disc">
              <li>Your completed activities vs. planned workouts</li>
              <li>Training volume and intensity patterns</li>
              <li>Heart rate data (if available)</li>
              <li>Your experience level and race goal</li>
              <li>Recovery needs and injury prevention</li>
            </ul>
          </div>

          {/* Add Context */}
          <div className="space-y-2 pt-2 border-t">
            <Label
              htmlFor="userFeedback"
              className="text-sm font-medium flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4 text-green-600" />
              Add Context (Optional)
            </Label>
            <Textarea
              id="userFeedback"
              placeholder="e.g., I was sick on Monday, traveling this weekend, feeling tired lately, want to focus on speed work..."
              value={userFeedback}
              onChange={(event) => setUserFeedback(event.target.value)}
              className="min-h-[80px] text-sm"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              Help the AI understand your situation for better recommendations.
            </p>
          </div>
        </div>

        <ResponsiveDialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isLoading}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Recommendation
              </>
            )}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};
