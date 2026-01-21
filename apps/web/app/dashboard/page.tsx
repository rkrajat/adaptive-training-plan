"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle } from "lucide-react";

import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useRecommendations } from "@/hooks/use-recommendations";
import { UploadTrainingPlanDialog } from "@/components/UploadTrainingPlanDialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import { DashboardLayout } from "./components/dashboard-layout";
import { RecommendationsCard } from "./components/recommendations";
import { RecentActivities } from "./components/activities";
import { TrainingPlanSection } from "./components/training-plan";
import { WeeklyRunsReport } from "./components/weekly-runs-report";

export default function DashboardPage() {
  const router = useRouter();

  // Authentication guard
  useAuthGuard();

  // Fetch all dashboard data
  const { user, activities, activePlan, isLoading, error } = useDashboardData();

  // Handle AI recommendations
  const {
    completion,
    recommendationId,
    isGenerating,
    error: recommendationError,
    handleRegenerate,
  } = useRecommendations(activePlan);

  // State for upload dialog
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

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
      {activePlan && (
        <WeeklyRunsReport
          currentWeek={activePlan.currentWeek}
          startDate={activePlan.startDate}
        />
      )}

      <RecommendationsCard
        completion={completion}
        isGenerating={isGenerating}
        error={recommendationError}
        onRegenerate={handleRegenerate}
        recommendationId={recommendationId || undefined}
      />

      <RecentActivities activities={activities} />

      <TrainingPlanSection
        activePlan={activePlan}
        onUploadClick={() => setIsUploadDialogOpen(true)}
      />

      <UploadTrainingPlanDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
      />
    </DashboardLayout>
  );
}
