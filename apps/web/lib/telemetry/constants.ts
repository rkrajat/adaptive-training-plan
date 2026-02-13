/**
 * OpenTelemetry event names for the frontend.
 * Single source of truth for all custom telemetry instrumentation.
 */
export const TELEMETRY_EVENTS = {
  // Auth events
  AUTH_CALLBACK_SUCCESS: "auth.callback_success",
  AUTH_CALLBACK_ERROR: "auth.callback_error",

  // Onboarding events
  ONBOARDING_STEP_VIEW: "onboarding.step_view",
  ONBOARDING_STEP_COMPLETE: "onboarding.step_complete",
  ONBOARDING_SKIP: "onboarding.skip",

  // Recommendation events
  RECOMMENDATION_ACCEPT_CLICK: "recommendation.accept_click",
  RECOMMENDATION_REJECT_CLICK: "recommendation.reject_click",
  RECOMMENDATION_REJECT_ACTION_SELECTED: "recommendation.reject_action_selected",

  // Feedback events
  FEEDBACK_MODAL_OPEN: "feedback.modal_open",
  FEEDBACK_SUBMIT_CLICK: "feedback.submit_click",
} as const;

export type TelemetryEvent =
  (typeof TELEMETRY_EVENTS)[keyof typeof TELEMETRY_EVENTS];
