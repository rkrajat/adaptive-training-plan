export interface TrainingPlanMetadata {
  name: string;
  goal?: string;
  raceName?: string;
  raceDate?: string;
  raceDistance?: string;
  targetTime?: string;
}

export interface TrainingPlan {
  id: string;
  userId: string;
  metadata: TrainingPlanMetadata;
  source: 'user_upload' | 'ai_generated';
  isActive: boolean;
  currentWeek: number;
  startDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingPlanWithContent extends TrainingPlan {
  csvContent: string;
}

export interface TrainingPlanVersion {
  id: string;
  trainingPlanId: string;
  versionNumber: number;
  metadata: TrainingPlanMetadata;
  changeType: 'created' | 'updated' | 'ai_modified';
  changeDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TrainingPlanWithVersions extends TrainingPlanWithContent {
  versions: TrainingPlanVersion[];
}

/**
 * Time range for a pace group (e.g., "2:00-2:20")
 */
export interface PaceGroupTimeRange {
  minSeconds: number; // Minimum time in seconds (inclusive)
  maxSeconds: number | null; // Maximum time in seconds (inclusive), null for "Sub X" groups
  label: string; // Human-readable label (e.g., "2:00-2:20", "Sub 2:00")
}

/**
 * Training paces for a specific pace group
 */
export interface PaceGroupPaces {
  easy?: string; // Easy pace range (e.g., "6:00-6:15/km")
  tempo?: string; // Tempo pace range (e.g., "5:30-5:45/km")
  interval?: string; // Interval pace range (e.g., "4:45-5:00/km")
  long?: string; // Long run pace range (e.g., "6:15-6:30/km")
  recovery?: string; // Recovery pace range (e.g., "6:30-6:45/km")
  [key: string]: string | undefined; // Allow other pace types
}

/**
 * A pace group definition from a training plan
 */
export interface PaceGroup {
  id: string; // Unique identifier (e.g., "group-1", "group-2")
  timeRange: PaceGroupTimeRange; // Time range for this pace group
  paces: PaceGroupPaces; // Training paces for this group
  label?: string; // Optional human-readable label (e.g., "Sub 2:00", "2:00-2:20")
}
