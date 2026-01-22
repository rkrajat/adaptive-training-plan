"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ACTIONS, STATUS } from "react-joyride";

import {
  hasCompletedTour,
  markTourCompleted,
  resetTourCompletion,
} from "@/lib/onboarding-storage";
import { getFilteredTourSteps } from "@/components/onboarding/constants";
import type {
  TourCallbackData,
  UseOnboardingTourReturn,
} from "@/components/onboarding/types";

const TOUR_START_DELAY_MS = 1000;

interface UseOnboardingTourOptions {
  hasActivePlan?: boolean;
  hasRecommendation?: boolean;
}

/**
 * Hook to manage onboarding tour state
 * Auto-starts tour for first-time users after dashboard loads
 */
export const useOnboardingTour = ({
  hasActivePlan,
  hasRecommendation,
}: UseOnboardingTourOptions = {}): UseOnboardingTourReturn => {
  const [isRunning, setIsRunning] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Derive steps from UI state using useMemo
  const steps = useMemo(
    () =>
      getFilteredTourSteps({
        hasActivePlan,
        hasRecommendation,
      }),
    [hasActivePlan, hasRecommendation]
  );

  // Auto-start tour for first-time users
  useEffect(() => {
    const shouldStartTour = !hasCompletedTour();

    if (shouldStartTour) {
      const timer = setTimeout(() => {
        setIsRunning(true);
      }, TOUR_START_DELAY_MS);

      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = useCallback(() => {
    setStepIndex(0);
    setIsRunning(true);
  }, []);

  const handleCallback = useCallback(
    (data: TourCallbackData) => {
      const { action, status, index } = data;

      // Tour finished or skipped
      if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
        setIsRunning(false);
        setStepIndex(0);
        markTourCompleted();
        return;
      }

      // Close button clicked
      if (action === ACTIONS.CLOSE) {
        setIsRunning(false);
        setStepIndex(0);
        markTourCompleted();
        return;
      }

      // Next step
      if (action === ACTIONS.NEXT) {
        setStepIndex(index + 1);
        return;
      }

      // Previous step
      if (action === ACTIONS.PREV) {
        setStepIndex(index - 1);
        return;
      }

      // Skip to next if target not found
      if (action === ACTIONS.SKIP) {
        setIsRunning(false);
        setStepIndex(0);
        markTourCompleted();
        return;
      }
    },
    []
  );

  return {
    isRunning,
    stepIndex,
    steps,
    startTour,
    handleCallback,
  };
};

/**
 * Reset the onboarding tour and trigger a restart
 */
export const resetOnboardingTour = (): void => {
  resetTourCompletion();
};
