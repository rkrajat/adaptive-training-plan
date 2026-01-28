import type { LucideIcon } from "lucide-react";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

import type { TrainingStatusType } from "./types";

/**
 * Status display configuration
 */
export interface StatusDisplayConfig {
  label: string;
  description: string;
  icon: LucideIcon;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  iconColorClass: string;
}

/**
 * Status display mappings for each training status type
 */
export const STATUS_DISPLAY_CONFIG: Record<TrainingStatusType, StatusDisplayConfig> = {
  on_track: {
    label: "On Track",
    description: "Your training is progressing well",
    icon: CheckCircle,
    colorClass: "text-green-700 dark:text-green-400",
    bgClass: "bg-green-50 dark:bg-green-950/30",
    borderClass: "border-green-200 dark:border-green-800",
    iconColorClass: "text-green-600 dark:text-green-500",
  },
  slightly_off_track: {
    label: "Slightly Off Track",
    description: "Minor adjustments may be needed",
    icon: AlertTriangle,
    colorClass: "text-yellow-700 dark:text-yellow-400",
    bgClass: "bg-yellow-50 dark:bg-yellow-950/30",
    borderClass: "border-yellow-200 dark:border-yellow-800",
    iconColorClass: "text-yellow-600 dark:text-yellow-500",
  },
  off_track: {
    label: "Off Track",
    description: "Consider reviewing your training plan",
    icon: XCircle,
    colorClass: "text-red-700 dark:text-red-400",
    bgClass: "bg-red-50 dark:bg-red-950/30",
    borderClass: "border-red-200 dark:border-red-800",
    iconColorClass: "text-red-600 dark:text-red-500",
  },
};
