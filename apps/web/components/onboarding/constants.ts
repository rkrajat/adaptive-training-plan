import type { TourStep } from "./types";

/**
 * Tour step targets - CSS selectors for each tour step
 */
export const TOUR_TARGETS = {
  TRAINING_STATUS: '[data-tour="training-status-banner"]',
  TRAINING_PLAN: '[data-tour="training-plan-section"]',
  RECOMMENDATIONS: '[data-tour="recommendations-card"]',
  ACCEPT_REJECT: '[data-tour="accept-reject-buttons"]',
  WEEKLY_STATS: '[data-tour="weekly-runs-report"]',
  RECENT_ACTIVITIES: '[data-tour="recent-activities"]',
  USER_MENU: '[data-tour="user-menu"]',
} as const;

/**
 * All available tour steps
 * Order follows the first-time user workflow:
 * 1. Welcome -> 2. Upload Plan -> 3. View Activities -> 4. Get Recommendations
 * -> 5. Accept/Reject -> 6. Weekly Stats -> 7. Training Status -> 8. User Menu
 */
export const ALL_TOUR_STEPS: TourStep[] = [
  // 1. Welcome - Introduction
  {
    target: "body",
    content:
      "Welcome to AdaptiveRunning! Let me show you around and help you get started with your personalized training.",
    placement: "center",
    disableBeacon: true,
  },
  // 2. Training Plan - First action for new users
  {
    target: TOUR_TARGETS.TRAINING_PLAN,
    content:
      "Start by uploading your training plan here. You can upload a CSV or a PDF file with your weekly training schedule.",
    placement: "top",
    disableBeacon: true,
  },
  // 3. Recent Activities - Already available, shows Strava data
  {
    target: TOUR_TARGETS.RECENT_ACTIVITIES,
    content:
      "Your recent Strava activities appear here. We analyze these to understand your training load and progress.",
    placement: "top",
    disableBeacon: true,
  },
  // 4. Recommendations Card - Main feature after uploading plan
  {
    target: TOUR_TARGETS.RECOMMENDATIONS,
    content:
      'Once you have a plan, click "Get Recommendations" to receive AI-powered weekly training recommendations based on your Strava data.',
    placement: "bottom",
    disableBeacon: true,
  },
  // 5. Accept/Reject (conditional) - After viewing recommendation
  {
    target: TOUR_TARGETS.ACCEPT_REJECT,
    content:
      "Review your recommendation and either accept it to save this recommendation till next week, or reject it to get a new one.",
    placement: "bottom",
    disableBeacon: true,
  },
  // 6. Weekly Stats (conditional) - Available with active plan
  {
    target: TOUR_TARGETS.WEEKLY_STATS,
    content:
      "View your weekly running statistics from Strava here. This data helps generate personalized recommendations.",
    placement: "bottom",
    disableBeacon: true,
  },
  // 7. Training Status (conditional) - Available after week 1 with active plan
  {
    target: TOUR_TARGETS.TRAINING_STATUS,
    content:
      "This banner shows your current training status. It uses AI to assess whether you're on track, slightly off track, or off track based on your recent activities compared to your plan.",
    placement: "bottom",
    disableBeacon: true,
  },
  // 8. User Menu - Always last
  {
    target: TOUR_TARGETS.USER_MENU,
    content:
      'Access your profile settings and replay this tour anytime from the "Help" option in the menu.',
    placement: "bottom-end",
    disableBeacon: true,
  },
];

/**
 * Filter tour steps based on current UI state
 */
export const getFilteredTourSteps = ({
  hasActivePlan,
  hasRecommendation,
  hasTrainingStatus,
}: {
  hasActivePlan?: boolean;
  hasRecommendation?: boolean;
  hasTrainingStatus?: boolean;
}): TourStep[] => {
  return ALL_TOUR_STEPS.filter((step) => {
    // Always show welcome, training plan, recommendations, recent activities, and user menu
    if (
      step.target === "body" ||
      step.target === TOUR_TARGETS.TRAINING_PLAN ||
      step.target === TOUR_TARGETS.RECOMMENDATIONS ||
      step.target === TOUR_TARGETS.RECENT_ACTIVITIES ||
      step.target === TOUR_TARGETS.USER_MENU
    ) {
      return true;
    }

    // Only show training status step if the status banner is visible
    if (step.target === TOUR_TARGETS.TRAINING_STATUS) {
      return hasTrainingStatus;
    }

    // Only show accept/reject step if there's a recommendation
    if (step.target === TOUR_TARGETS.ACCEPT_REJECT) {
      return hasRecommendation;
    }

    // Only show weekly stats if there's an active plan
    if (step.target === TOUR_TARGETS.WEEKLY_STATS) {
      return hasActivePlan;
    }

    return true;
  });
};
