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
