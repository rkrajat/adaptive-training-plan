import { Activity, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { FeedbackButton } from "../feedback";
import { AcceptRejectButtons } from "./accept-reject-buttons";
import { StructuredRecommendation } from "./structured-recommendation";
import type { RecommendationStatus } from "./types";

interface OriginalPlanData {
  csvContent: string;
  currentWeek: number;
  startDate: string;
}

interface RecommendationsCardProps {
  completion: string;
  isGenerating: boolean;
  error: Error | null;
  onRegenerate: () => void;
  recommendationId?: string;
  recommendationStatus?: RecommendationStatus;
  onAccept?: () => void;
  onReject?: () => void;
  isAccepting?: boolean;
  isRejecting?: boolean;
  /** Original training plan data for diff highlighting */
  originalPlan?: OriginalPlanData;
  /** Current training week number */
  currentWeek?: number;
  /** Callback when week summary button is clicked */
  onViewWeeklySummary?: () => void;
}

/**
 * Card component to display AI-generated training recommendations
 * Handles loading, error, content, and empty states
 */
export const RecommendationsCard = ({
  completion,
  isGenerating,
  error,
  onRegenerate,
  recommendationId,
  recommendationStatus,
  onAccept,
  onReject,
  isAccepting = false,
  isRejecting = false,
  originalPlan,
  currentWeek,
  onViewWeeklySummary,
}: RecommendationsCardProps) => {
  const showAcceptReject =
    recommendationStatus === "pending" &&
    !isGenerating &&
    completion &&
    onAccept &&
    onReject;
  return (
    <Card className="mb-6 sm:mb-8" data-tour="recommendations-card">
      <CardHeader className="pb-3 sm:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 sm:gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-4">
            <CardTitle className="text-lg sm:text-xl">
              Next Week&apos;s Training Recommendation
            </CardTitle>
            {currentWeek && onViewWeeklySummary && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewWeeklySummary}
                className="h-8 text-xs w-full sm:w-auto border-orange-200 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:text-orange-400 dark:hover:bg-orange-950/50"
                data-tour="weekly-runs-report"
              >
                <Activity className="h-3.5 w-3.5 mr-1.5" />
                View Week {currentWeek} Summary
              </Button>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-2">
            {/* Accept/Reject Buttons - only for pending recommendations */}
            {showAcceptReject && (
              <AcceptRejectButtons
                onAccept={onAccept}
                onReject={onReject}
                isAccepting={isAccepting}
                isRejecting={isRejecting}
              />
            )}
            {/* Feedback Button - only for accepted recommendations */}
            {recommendationId &&
              !isGenerating &&
              recommendationStatus === "accepted" && (
                <FeedbackButton recommendationId={recommendationId} />
              )}
            <Button
              onClick={onRegenerate}
              disabled={isGenerating || isAccepting || isRejecting}
              className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
              size="sm"
            >
              {isGenerating
                ? "Generating..."
                : completion
                  ? "Regenerate"
                  : "Get Recommendations"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Loading State */}
        {isGenerating && !completion && (
          <div className="space-y-4">
            <div className="h-4 bg-muted rounded animate-pulse w-3/4"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-full"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-5/6"></div>
            <div className="h-4 bg-muted rounded animate-pulse w-2/3"></div>
          </div>
        )}

        {/* Error State */}
        {error && !completion && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Failed to generate recommendation</AlertTitle>
            <AlertDescription>
              {error.message}
              <Button
                onClick={onRegenerate}
                variant="link"
                className="mt-2 p-0 h-auto text-red-700 hover:text-red-800"
              >
                Try again →
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Streaming/Completed Content */}
        {completion && (
          <div className="space-y-4">
            <StructuredRecommendation
              markdown={completion}
              originalPlan={originalPlan}
            />
          </div>
        )}

        {/* Empty State */}
        {!isGenerating && !completion && !error && (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              Click &quot;Get Recommendations&quot; to get your personalized
              training recommendation for next week
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
