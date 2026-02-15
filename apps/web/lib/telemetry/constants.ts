/**
 * OpenTelemetry event names for the frontend.
 * Single source of truth for all custom telemetry instrumentation.
 */
export const TELEMETRY_EVENTS = {
  // Auth events (combined with status attribute: "success" | "error")
  AUTH_CALLBACK: "auth.callback",
  AUTO_AUTH_REDIRECT: "auth.auto_redirect",

  // Onboarding events (kept separate - different actions)
  ONBOARDING_STEP_VIEW: "onboarding.step_view",
  ONBOARDING_STEP_COMPLETE: "onboarding.step_complete",
  ONBOARDING_SKIP: "onboarding.skip",

  // Recommendation events
  RECOMMENDATION_REQUEST: "recommendation.request",
  RECOMMENDATION_ACTION: "recommendation.action",
  RECOMMENDATION_REJECT_ACTION_SELECTED:
    "recommendation.reject_action_selected",

  // Feedback events (kept separate - different actions)
  FEEDBACK_MODAL_OPEN: "feedback.modal_open",
  FEEDBACK_SUBMIT_CLICK: "feedback.submit_click",
} as const;

export type TelemetryEvent =
  (typeof TELEMETRY_EVENTS)[keyof typeof TELEMETRY_EVENTS];
