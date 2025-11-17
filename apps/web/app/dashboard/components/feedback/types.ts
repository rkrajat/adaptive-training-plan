/**
 * Form data structure for feedback submission
 */
export interface FeedbackFormData {
  rating: number;
  wouldFollow: boolean;
  comment?: string;
}

/**
 * Request payload for submitting feedback to API
 */
export interface FeedbackSubmitRequest {
  recommendationId: string;
  usefulnessRating: number;
  wouldFollow: boolean;
  comment?: string;
}

/**
 * API response structure after successful feedback submission
 */
export interface FeedbackSubmitResponse {
  id: string;
  userId: string;
  recommendationId: string;
  usefulnessRating: number;
  wouldFollow: boolean;
  comment: string | null;
  createdAt: Date;
  updatedAt: Date;
  message?: string;
}

/**
 * API response for checking feedback status
 */
export interface FeedbackStatusResponse {
  hasSubmitted: boolean;
}

/**
 * Error structure for feedback operations
 */
export interface FeedbackError {
  error: string;
  details?: unknown;
}
