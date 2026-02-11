"use client";

import {
  Gauge,
  Target,
  Zap,
  Clock,
  Footprints,
  Timer,
  CircleHelp,
} from "lucide-react";

import type {
  RaceGoal,
  TrainingPaces,
  PaceRange,
} from "@adaptive-training-plan/types";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface TrainingPacesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  raceGoal: RaceGoal;
}

interface TrainingPacesContentProps {
  raceGoal: RaceGoal;
}

interface PaceZoneItemProps {
  icon: React.ReactNode;
  label: string;
  paceRange: PaceRange;
  description: string;
  color: string;
}

/**
 * Format pace from seconds per km to min:sec per km
 */
const formatPace = (secondsPerKm: number): string => {
  if (secondsPerKm === 0) return "-";
  const minutes = Math.floor(secondsPerKm / 60);
  const seconds = Math.round(secondsPerKm % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * Format pace range for display
 */
const formatPaceRange = (paceRange: PaceRange): string => {
  return `${formatPace(paceRange.minPace)} - ${formatPace(paceRange.maxPace)}`;
};

/**
 * Format target time from seconds to readable format
 */
const formatTargetTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.round(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Training zone configuration with descriptions and colors
 */
const PACE_ZONE_CONFIG: Record<
  keyof TrainingPaces,
  { label: string; description: string; color: string; icon: React.ReactNode }
> = {
  easy: {
    label: "Easy",
    description:
      "Recovery runs, warm-up, cool-down. Should feel comfortable and conversational.",
    color: "text-green-600 dark:text-green-400",
    icon: <Footprints className="h-4 w-4" />,
  },
  longRun: {
    label: "Long Run",
    description: "Endurance building runs. Steady effort for extended periods.",
    color: "text-blue-600 dark:text-blue-400",
    icon: <Clock className="h-4 w-4" />,
  },
  marathon: {
    label: "Marathon",
    description: "Target marathon race pace. Sustainable for 26.2 miles.",
    color: "text-purple-600 dark:text-purple-400",
    icon: <Target className="h-4 w-4" />,
  },
  threshold: {
    label: "Threshold",
    description: "Tempo runs at lactate threshold. Comfortably hard effort.",
    color: "text-amber-600 dark:text-amber-400",
    icon: <Gauge className="h-4 w-4" />,
  },
  interval: {
    label: "Interval",
    description:
      "VO2max intervals, typically 3-5 min efforts. Hard but controlled.",
    color: "text-orange-600 dark:text-orange-400",
    icon: <Timer className="h-4 w-4" />,
  },
  repetition: {
    label: "Repetition",
    description: "Speed work, short fast efforts. Near maximum effort.",
    color: "text-red-600 dark:text-red-400",
    icon: <Zap className="h-4 w-4" />,
  },
};

/**
 * Individual pace zone row
 */
const PaceZoneItem = ({
  icon,
  label,
  paceRange,
  description,
  color,
}: PaceZoneItemProps) => (
  <div className="flex items-center justify-between py-2 border-b border-muted last:border-0">
    <div className="flex items-center gap-2">
      <span className={color}>{icon}</span>
      <span className="text-sm font-medium">{label}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <CircleHelp className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px]">
            <p className="text-xs">{description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
    <span className="text-sm font-mono tabular-nums">
      {formatPaceRange(paceRange)}{" "}
      <span className="text-muted-foreground">/km</span>
    </span>
  </div>
);

/**
 * Training Paces Content Component
 * Displays the training pace zones without dialog wrapper - for embedding in other dialogs
 */
export const TrainingPacesContent = ({
  raceGoal,
}: TrainingPacesContentProps) => {
  const { paces, distanceLabel, targetTimeSeconds, vdot } = raceGoal;

  const paceZones: Array<keyof TrainingPaces> = [
    "easy",
    "longRun",
    "marathon",
    "threshold",
    "interval",
    "repetition",
  ];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Gauge className="h-5 w-5 text-indigo-600" />
        <span className="font-semibold">My Training Paces</span>
        <span className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
          VDOT {vdot.toFixed(1)}
        </span>
      </div>
      <p className="text-sm text-muted-foreground">
        Based on your {distanceLabel} goal of{" "}
        {formatTargetTime(targetTimeSeconds)}
      </p>
      <div className="space-y-0">
        {paceZones.map((zone) => {
          const config = PACE_ZONE_CONFIG[zone];
          return (
            <PaceZoneItem
              key={zone}
              icon={config.icon}
              label={config.label}
              paceRange={paces[zone]}
              description={config.description}
              color={config.color}
            />
          );
        })}
      </div>
    </div>
  );
};

/**
 * Training Paces Dialog Component
 * Displays calculated training paces based on user's race goal and VDOT in a dialog
 */
export const TrainingPacesDialog = ({
  open,
  onOpenChange,
  raceGoal,
}: TrainingPacesDialogProps) => {
  const { paces, distanceLabel, targetTimeSeconds, vdot } = raceGoal;

  const paceZones: Array<keyof TrainingPaces> = [
    "easy",
    "longRun",
    "marathon",
    "threshold",
    "interval",
    "repetition",
  ];

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-indigo-600" />
            My Training Paces
            <span className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
              VDOT {vdot.toFixed(1)}
            </span>
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            Based on your {distanceLabel} goal of{" "}
            {formatTargetTime(targetTimeSeconds)}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="py-2">
          <div className="space-y-0">
            {paceZones.map((zone) => {
              const config = PACE_ZONE_CONFIG[zone];
              return (
                <PaceZoneItem
                  key={zone}
                  icon={config.icon}
                  label={config.label}
                  paceRange={paces[zone]}
                  description={config.description}
                  color={config.color}
                />
              );
            })}
          </div>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};
