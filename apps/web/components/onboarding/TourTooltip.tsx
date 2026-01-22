"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

import type { TourTooltipProps } from "./types";

/**
 * Custom tooltip component for the onboarding tour
 * Uses shadcn/ui components for consistent styling
 */
export const TourTooltip = ({
  continuous,
  index,
  isLastStep,
  size,
  step,
  backProps,
  closeProps,
  primaryProps,
  skipProps,
  tooltipProps,
}: TourTooltipProps) => {
  return (
    <Card
      {...tooltipProps}
      className="w-[320px] max-w-[90vw] shadow-lg border-orange-200 dark:border-orange-800"
    >
      <CardHeader className="pb-2 pt-4 px-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-orange-500" />
          <span className="text-xs font-medium text-muted-foreground">
            Step {index + 1} of {size}
          </span>
        </div>
        <button
          {...closeProps}
          className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          aria-label="Close tour"
        >
          <X className="h-4 w-4" />
        </button>
      </CardHeader>

      <CardContent className="px-4 py-3">
        <p className="text-sm text-foreground leading-relaxed">{step.content}</p>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-2 flex items-center justify-between gap-2">
        {!isLastStep && (
          <Button
            {...skipProps}
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-foreground"
          >
            Skip tour
          </Button>
        )}

        <div className="flex items-center gap-2 ml-auto">
          {index > 0 && (
            <Button {...backProps} variant="outline" size="sm">
              Back
            </Button>
          )}
          <Button
            {...primaryProps}
            size="sm"
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            {continuous && !isLastStep ? "Next" : "Finish"}
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};
