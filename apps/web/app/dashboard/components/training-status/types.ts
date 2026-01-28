/**
 * Training status types for the status indicator
 */
export type TrainingStatusType = "on_track" | "slightly_off_track" | "off_track";

/**
 * Ineligibility reasons for training status
 */
export type IneligibilityReason = "no_active_plan" | "week_one" | "no_recent_activities";

/**
 * Training status success response
 */
export interface TrainingStatusSuccess {
  status: TrainingStatusType;
  rationale: string;
  currentWeek: number;
}

/**
 * Training status ineligible response
 */
export interface TrainingStatusIneligible {
  eligibleForStatus: false;
  reason: IneligibilityReason;
}

/**
 * Combined training status response
 */
export type TrainingStatusResponse = TrainingStatusSuccess | TrainingStatusIneligible;

/**
 * Type guard to check if response is ineligible
 */
export const isIneligibleResponse = (
  response: TrainingStatusResponse
): response is TrainingStatusIneligible => {
  return "eligibleForStatus" in response && response.eligibleForStatus === false;
};

/**
 * Type guard to check if response is a success
 */
export const isSuccessResponse = (
  response: TrainingStatusResponse
): response is TrainingStatusSuccess => {
  return "status" in response && !("eligibleForStatus" in response);
};
