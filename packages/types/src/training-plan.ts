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
 * Valid workout types for training plans
 */
export type WorkoutType =
  | "Easy"
  | "Long"
  | "Tempo"
  | "Interval"
  | "Recovery"
  | "Rest"
  | "Race"
  | "Cross-Training"
  | "Progression";

/**
 * Valid day abbreviations
 */
export type DayAbbreviation = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

/**
 * Heart rate zone type
 */
export type HRZone = "Z1" | "Z2" | "Z3" | "Z4" | "Z5" | "";

/**
 * Individual training plan row from PDF extraction
 */
export interface TrainingPlanRow {
  date: string;
  day: DayAbbreviation;
  type: WorkoutType;
  planned_distance_km: number;
  target_pace_min_per_km: string;
  target_HR_zone: HRZone;
  notes: string;
}

/**
 * Validation error for a row field
 */
export interface RowValidationError {
  field: string;
  message: string;
}

/**
 * Invalid row from extraction with errors
 */
export interface InvalidRow {
  rowIndex: number;
  data: Partial<TrainingPlanRow>;
  errors: RowValidationError[];
}

/**
 * Extracted data structure for manual correction UI
 */
export interface ExtractedTrainingPlanData {
  validRows: TrainingPlanRow[];
  invalidRows: InvalidRow[];
  totalRows: number;
  validRowCount: number;
  invalidRowCount: number;
}

/**
 * API response when PDF conversion requires manual correction
 */
export interface ManualCorrectionResponse {
  status: "requires_manual_correction";
  message: string;
  extractedData: ExtractedTrainingPlanData;
  attemptsMade: number;
}
