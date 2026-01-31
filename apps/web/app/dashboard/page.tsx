"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useRecommendations } from "@/hooks/use-recommendations";
import {
  useActiveRecommendation,
  useAcceptRecommendation,
  useRejectRecommendation,
} from "@/hooks/use-recommendation-acceptance";
import { useTrainingStatus } from "@/hooks/use-training-status";
import { UploadTrainingPlanDialog } from "@/components/UploadTrainingPlanDialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { OnboardingTour } from "@/components/onboarding";

import { DashboardLayout } from "./components/dashboard-layout";
import {
  RecommendationsCard,
  RejectDialog,
  ReplaceConfirmationDialog,
} from "./components/recommendations";
import type { RejectAction } from "./components/recommendations";
import { ActivitiesDialog } from "./components/activities";
import { ViewActivitiesButton } from "./components/activities/view-activities-button";
import { TrainingPlanSection } from "./components/training-plan";
import {
  TrainingStatusBanner,
  TrainingStatusBannerSkeleton,
  isSuccessResponse,
} from "./components/training-status";
import { WeeklyRunsReport } from "./components/weekly-runs-report";

export default function DashboardPage() {
  const router = useRouter();

  // Fetch all dashboard data
  const { user, activities, activePlan, isLoading, error } = useDashboardData();

  // Handle AI recommendations
  const {
    completion,
    recommendationId,
    recommendationStatus,
    isGenerating,
    error: recommendationError,
    handleRegenerate,
    generateRecommendations,
    setCompletion,
    setRecommendationId,
    setRecommendationStatus,
  } = useRecommendations(activePlan);

  // Fetch active recommendation on mount
  const { data: activeRecommendation } = useActiveRecommendation();

  // Fetch training status (only when user has an active plan)
  const {
    data: trainingStatusData,
    isLoading: isTrainingStatusLoading,
  } = useTrainingStatus({ enabled: !!activePlan });

  // Accept/reject mutations
  const acceptMutation = useAcceptRecommendation();
  const rejectMutation = useRejectRecommendation();

  // State for dialogs
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isReplaceDialogOpen, setIsReplaceDialogOpen] = useState(false);
  const [isActivitiesDialogOpen, setIsActivitiesDialogOpen] = useState(false);

  // Load active recommendation on mount
  useEffect(() => {
    if (activeRecommendation && !completion) {
      setCompletion(activeRecommendation.content);
      setRecommendationId(activeRecommendation.id);
      setRecommendationStatus(activeRecommendation.status);
    }
  }, [activeRecommendation, completion, setCompletion, setRecommendationId, setRecommendationStatus]);

  // Handle regenerate click - show confirmation if active recommendation exists
  const handleRegenerateClick = () => {
    if (activeRecommendation) {
      setIsReplaceDialogOpen(true);
    } else {
      handleRegenerate();
    }
  };

  // Confirm replacement and generate new
  const handleConfirmReplace = () => {
    setIsReplaceDialogOpen(false);
    handleRegenerate();
  };

  // Handle accept recommendation
  const handleAccept = () => {
    if (!recommendationId) return;

    acceptMutation.mutate(recommendationId, {
      onSuccess: () => {
        setRecommendationStatus("accepted");
        toast.success("Recommendation accepted!", {
          description: "Your recommendation is saved for this week.",
        });
      },
      onError: (err) => {
        toast.error("Failed to accept recommendation", {
          description: err.message,
        });
      },
    });
  };

  // Handle reject button click - open dialog
  const handleRejectClick = () => {
    setIsRejectDialogOpen(true);
  };

  // Handle reject action selection
  const handleRejectAction = (action: RejectAction) => {
    if (!recommendationId) return;

    rejectMutation.mutate(
      { recommendationId, action },
      {
        onSuccess: (data) => {
          setIsRejectDialogOpen(false);
          setRecommendationStatus("rejected");

          if (data.action === "generate_new") {
            toast.info("Generating new recommendation...");
            // Clear current and generate new
            setCompletion("");
            setRecommendationId(null);
            setRecommendationStatus(undefined);
            generateRecommendations().catch(console.error);
          } else {
            toast.success("Recommendation discarded");
            // Clear state to show empty state
            setCompletion("");
            setRecommendationId(null);
            setRecommendationStatus(undefined);
          }
        },
        onError: (err) => {
          toast.error("Failed to reject recommendation", {
            description: err.message,
          });
        },
      }
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="text-center">
          <Loader2 className="inline-block h-8 w-8 sm:h-12 sm:w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-sm sm:text-lg text-muted-foreground">
            Loading your data...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Data</AlertTitle>
            <AlertDescription className="text-sm">
              {error.message || "Failed to load data"}
              <Button
                onClick={() => router.push("/login")}
                variant="destructive"
                className="mt-4 w-full"
                size="sm"
              >
                Return to Login
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout user={user}>
      <OnboardingTour
        hasActivePlan={!!activePlan}
        hasRecommendation={!!completion && recommendationStatus === "pending"}
        hasTrainingStatus={!!trainingStatusData && isSuccessResponse(trainingStatusData)}
      />

      {/* Training Status Banner - shown at top when eligible */}
      {isTrainingStatusLoading && activePlan && <TrainingStatusBannerSkeleton />}
      {trainingStatusData && isSuccessResponse(trainingStatusData) && (
        <TrainingStatusBanner
          status={trainingStatusData.status}
          rationale={trainingStatusData.rationale}
          currentWeek={trainingStatusData.currentWeek}
        />
      )}

      {activePlan ? (
        <WeeklyRunsReport
          currentWeek={activePlan.currentWeek}
          startDate={activePlan.startDate}
          onViewActivities={() => setIsActivitiesDialogOpen(true)}
        />
      ) : (
        <ViewActivitiesButton
          activityCount={activities.length}
          onClick={() => setIsActivitiesDialogOpen(true)}
        />
      )}

      <RecommendationsCard
        completion={completion}
        isGenerating={isGenerating}
        error={recommendationError}
        onRegenerate={handleRegenerateClick}
        recommendationId={recommendationId || undefined}
        recommendationStatus={recommendationStatus}
        onAccept={handleAccept}
        onReject={handleRejectClick}
        isAccepting={acceptMutation.isPending}
        isRejecting={rejectMutation.isPending}
      />

      <TrainingPlanSection
        activePlan={activePlan}
        onUploadClick={() => setIsUploadDialogOpen(true)}
      />

      <UploadTrainingPlanDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
      />

      <RejectDialog
        isOpen={isRejectDialogOpen}
        onClose={() => setIsRejectDialogOpen(false)}
        onSelectAction={handleRejectAction}
        isLoading={rejectMutation.isPending}
      />

      <ReplaceConfirmationDialog
        isOpen={isReplaceDialogOpen}
        onClose={() => setIsReplaceDialogOpen(false)}
        onConfirm={handleConfirmReplace}
        isLoading={isGenerating}
      />

      <ActivitiesDialog
        activities={activities}
        open={isActivitiesDialogOpen}
        onOpenChange={setIsActivitiesDialogOpen}
      />
    </DashboardLayout>
  );
}
