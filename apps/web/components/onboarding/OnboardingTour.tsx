"use client";

import { useState, useEffect } from "react";
import type { CallBackProps, Props as JoyrideProps } from "react-joyride";
import { ACTIONS, EVENTS, STATUS } from "react-joyride";

import { useOnboardingTour } from "@/hooks/use-onboarding-tour";

import { TourTooltip } from "./TourTooltip";
import type { OnboardingTourProps, TourCallbackData } from "./types";

type JoyrideComponent = React.ComponentType<JoyrideProps>;

/**
 * OnboardingTour component that wraps React Joyride
 * Handles tour state and renders the tour UI
 */
export const OnboardingTour = ({
  hasActivePlan,
  hasRecommendation,
  hasTrainingStatus,
}: OnboardingTourProps) => {
  const [Joyride, setJoyride] = useState<JoyrideComponent | null>(null);
  const { isRunning, stepIndex, steps, handleCallback } = useOnboardingTour({
    hasActivePlan,
    hasRecommendation,
    hasTrainingStatus,
  });

  // Dynamically import Joyride on client side only
  useEffect(() => {
    import("react-joyride").then((module) => {
      setJoyride(() => module.default);
    });
  }, []);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, status, type } = data;

    // Handle step navigation and tour completion
    if (
      type === EVENTS.STEP_AFTER ||
      type === EVENTS.TARGET_NOT_FOUND ||
      status === STATUS.FINISHED ||
      status === STATUS.SKIPPED ||
      action === ACTIONS.CLOSE
    ) {
      handleCallback(data as TourCallbackData);
    }
  };

  if (!Joyride || !isRunning || steps.length === 0) {
    return null;
  }

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={isRunning}
      scrollToFirstStep
      showProgress
      showSkipButton
      stepIndex={stepIndex}
      steps={steps}
      disableOverlayClose
      spotlightClicks={false}
      tooltipComponent={TourTooltip}
      styles={{
        options: {
          zIndex: 10000,
          overlayColor: "rgba(0, 0, 0, 0.5)",
        },
        spotlight: {
          borderRadius: 8,
          backgroundColor: "transparent",
        },
        overlay: {
          mixBlendMode: "unset",
        },
      }}
      floaterProps={{
        styles: {
          floater: {
            filter: "none",
          },
        },
      }}
    />
  );
};
