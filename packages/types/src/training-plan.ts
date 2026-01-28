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
 * Time range for a pace group (in seconds)
 */
export interface PaceGroupTimeRange {
  minSeconds?: number;
  maxSeconds?: number;
}

/**
 * Pace ranges for different workout types within a pace group
 */
export interface PaceGroupPaces {
  easy?: string; // e.g., "6:40-7:10"
  tempo?: string; // e.g., "5:50-6:00"
  interval?: string;
  longRun?: string;
  marathon?: string;
  threshold?: string;
  repetition?: string;
  warmUp?: string;
  coolDown?: string;
  [key: string]: string | undefined; // Allow other pace types
}

/**
 * Pace group definition from training plan
 * Represents a group of runners targeting similar finish times
 */
export interface PaceGroup {
  id: string;
  name: string; // e.g., "Sub 2:00", "2:00-2:20", "Finish Strong"
  timeRange?: PaceGroupTimeRange;
  paces: PaceGroupPaces;
}
