const ONBOARDING_TOUR_COMPLETED_KEY = "onboarding_tour_completed";

/**
 * Check if the user has completed the onboarding tour
 */
export const hasCompletedTour = (): boolean => {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ONBOARDING_TOUR_COMPLETED_KEY) === "true";
};

/**
 * Mark the onboarding tour as completed
 */
export const markTourCompleted = (): void => {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARDING_TOUR_COMPLETED_KEY, "true");
};

/**
 * Reset the onboarding tour completion status (for replay)
 */
export const resetTourCompletion = (): void => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ONBOARDING_TOUR_COMPLETED_KEY);
};
