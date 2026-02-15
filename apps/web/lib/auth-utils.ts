import type {
  User,
  TrainingPlanWithContent,
} from "@adaptive-training-plan/types";

export interface OnboardingStatus {
  isComplete: boolean;
  hasExperienceLevel: boolean;
  hasActivePlan: boolean;
}

/**
 * Determine onboarding completion status based on user profile and active plans
 */
export const getOnboardingStatus = (
  user: User | null | undefined,
  activePlans: TrainingPlanWithContent[] | null | undefined,
): OnboardingStatus => {
  const hasExperienceLevel = !!user?.experienceLevel;
  const hasActivePlan = (activePlans?.length ?? 0) > 0;

  return {
    isComplete: hasExperienceLevel && hasActivePlan,
    hasExperienceLevel,
    hasActivePlan,
  };
};
