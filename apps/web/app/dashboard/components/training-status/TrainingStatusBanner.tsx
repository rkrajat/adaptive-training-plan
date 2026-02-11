"use client";

import { Skeleton } from "@/components/ui/skeleton";

import { STATUS_DISPLAY_CONFIG } from "./constants";
import type { TrainingStatusType } from "./types";

interface TrainingStatusBannerProps {
  status: TrainingStatusType;
  rationale: string;
  currentWeek: number;
}

/**
 * Loading skeleton for the training status banner
 */
export const TrainingStatusBannerSkeleton = () => {
  return (
    <div className="w-full h-full rounded-lg border p-4 animate-pulse">
      <div className="flex items-start gap-3">
        <Skeleton className="h-5 w-5 rounded-full flex-shrink-0 mt-0.5" />
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      </div>
    </div>
  );
};

/**
 * Training status banner component
 * Displays the current training status with icon, label, and rationale
 */
export const TrainingStatusBanner = ({
  status,
  rationale,
  currentWeek,
}: TrainingStatusBannerProps) => {
  const config = STATUS_DISPLAY_CONFIG[status];
  const StatusIcon = config.icon;

  return (
    <div
      className={`w-full rounded-lg border ${config.borderClass} ${config.bgClass} p-4 shadow-sm transition-all duration-300 ease-in-out`}
      role="status"
      aria-label={`Training status: ${config.label}`}
      data-tour="training-status-banner"
    >
      <div className="flex items-start gap-3">
        <StatusIcon
          className={`h-5 w-5 flex-shrink-0 mt-0.5 ${config.iconColorClass}`}
          aria-hidden="true"
        />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className={`font-semibold ${config.colorClass}`}>
              {config.label}
            </span>
            <span className="text-xs text-muted-foreground">
              Week {currentWeek}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
            {rationale}
          </p>
        </div>
      </div>
    </div>
  );
};
