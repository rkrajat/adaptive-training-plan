/**
 * The tracer name used for all backend OpenTelemetry instrumentation.
 */
export const TRACER_NAME = "adaptive-training-api";

/**
 * OpenTelemetry span/event names for the backend API.
 * Single source of truth for all custom telemetry instrumentation.
 */
export const TELEMETRY_EVENTS = {
  // Recommendation events
  RECOMMENDATION_GENERATE: "recommendation.generate",
  // RECOMMENDATION_ACCEPT removed - tracked on frontend as user intent
  // RECOMMENDATION_REJECT removed - tracked on frontend as user intent

  // Feedback events
  FEEDBACK_SUBMIT: "feedback.submit",

  // Training plan events
  TRAINING_PLAN_UPLOAD: "training_plan.upload",
} as const;

export type TelemetryEvent =
  (typeof TELEMETRY_EVENTS)[keyof typeof TELEMETRY_EVENTS];
