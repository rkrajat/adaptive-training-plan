/**
 * Status of a recommendation in its lifecycle
 */
export type RecommendationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

/**
 * Action to take when rejecting a recommendation
 */
export type RejectAction = 'generate_new' | 'discard';

/**
 * Active recommendation data returned from API
 */
export interface ActiveRecommendation {
  id: string;
  userId: string;
  trainingPlanId: string;
  weekNumber: number;
  content: string;
  status: RecommendationStatus;
  acceptedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

/**
 * Response wrapper for active recommendation query
 */
export interface ActiveRecommendationResponse {
  recommendation: ActiveRecommendation | null;
}

/**
 * Response wrapper for accept recommendation mutation
 */
export interface AcceptRecommendationResponse {
  recommendation: ActiveRecommendation;
}

/**
 * Request payload for rejecting a recommendation
 */
export interface RejectRecommendationRequest {
  action: RejectAction;
}

/**
 * Response from rejecting a recommendation
 */
export interface RejectRecommendationResponse {
  success: boolean;
  action: RejectAction;
}
