import type { Step, CallBackProps, STATUS, EVENTS, ACTIONS, TooltipRenderProps } from "react-joyride";

export interface TourStep extends Step {
  target: string;
}

export interface OnboardingTourState {
  isRunning: boolean;
  stepIndex: number;
  steps: TourStep[];
}

export interface TourCallbackData extends CallBackProps {
  status: (typeof STATUS)[keyof typeof STATUS];
  type: (typeof EVENTS)[keyof typeof EVENTS];
  action: (typeof ACTIONS)[keyof typeof ACTIONS];
}

export interface UseOnboardingTourReturn {
  isRunning: boolean;
  stepIndex: number;
  steps: TourStep[];
  startTour: () => void;
  handleCallback: (data: TourCallbackData) => void;
}

export type TourTooltipProps = TooltipRenderProps;

export interface OnboardingTourProps {
  hasActivePlan?: boolean;
  hasRecommendation?: boolean;
  hasTrainingStatus?: boolean;
}
