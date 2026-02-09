"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, X } from "lucide-react";
import { useState } from "react";

import type { User, TrainingPlanWithContent } from "@adaptive-training-plan/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

interface OnboardingReminderBannerProps {
  user: User | undefined;
  activePlan: TrainingPlanWithContent | undefined;
}

/**
 * Banner that reminds users to complete their profile setup
 * Shows if user is missing experience level or training plan
 */
export const OnboardingReminderBanner = ({
  user,
  activePlan,
}: OnboardingReminderBannerProps) => {
  const [isDismissed, setIsDismissed] = useState(false);

  // Don't show if dismissed or if onboarding is complete
  if (isDismissed) return null;
  if (!user) return null;

  const missingExperience = !user.experienceLevel;
  const missingPlan = !activePlan;

  // Don't show if everything is set up
  if (!missingExperience && !missingPlan) return null;

  const getMessage = () => {
    if (missingExperience && missingPlan) {
      return "Complete your profile setup to get personalized training recommendations.";
    }
    if (missingExperience) {
      return "Set your experience level to get better personalized recommendations.";
    }
    if (missingPlan) {
      return "Upload a training plan to start receiving AI-powered recommendations.";
    }
    return "";
  };

  return (
    <Alert className="mb-6 border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
      <Sparkles className="h-4 w-4 text-amber-600" />
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <span className="text-amber-800 dark:text-amber-200">{getMessage()}</span>
        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Link href="/onboarding">
              Complete Setup
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-amber-600 hover:text-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/30"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
