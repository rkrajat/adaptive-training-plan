"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Zap,
  Heart,
  Loader2,
  Archive,
  CloudUpload,
  XCircle,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import type { Activity, User } from "@adaptive-training-plan/types";

import { isAuthenticated } from "@/lib/auth";
import {
  activitiesApi,
  authApi,
  recommendationsApi,
  trainingPlansApi,
} from "@/lib/api";
import { Navigation } from "@/components/Navigation";
import { UploadTrainingPlanDialog } from "@/components/UploadTrainingPlanDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DashboardPage() {
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  // Fetch user profile
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery<User>({
    queryKey: ["user"],
    queryFn: authApi.me,
    enabled: isAuthenticated(),
  });

  // Fetch activities
  const {
    data: activitiesData,
    isLoading: isLoadingActivities,
    error: activitiesError,
  } = useQuery({
    queryKey: ["activities"],
    queryFn: activitiesApi.list,
    enabled: isAuthenticated(),
  });

  const activities = activitiesData?.activities || [];

  // Fetch training plans
  const { data: trainingPlansData, isLoading: isLoadingPlans } = useQuery({
    queryKey: ["trainingPlans"],
    queryFn: trainingPlansApi.list,
    enabled: isAuthenticated(),
  });

  const trainingPlans = trainingPlansData?.plans || [];
  const activePlan = trainingPlans.find((plan) => plan.isActive);

  // State for upload dialog
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  // State for AI-generated recommendations
  const [completion, setCompletion] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [completionError, setCompletionError] = useState<Error | null>(null);

  // Function to handle recommendations with training plan
  const generateRecommendations = async (
    userFeedback?: string
  ): Promise<void> => {
    setIsGenerating(true);
    setCompletionError(null);
    setCompletion("");

    try {
      // Check if user has an active training plan
      if (!activePlan) {
        throw new Error(
          "Please upload a training plan first to get recommendations"
        );
      }

      // Use the new endpoint with training plan
      const response: Response = await recommendationsApi.generateWithPlan(
        activePlan.id,
        userFeedback
      );

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body is not readable");
      }

      let accumulated = "";
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });

        accumulated += chunk;
        setCompletion(accumulated);
      }
    } catch (error) {
      console.error("Error generating recommendations:", error);
      setCompletionError(error as Error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Auto-generate recommendations when training plan is available
  useEffect(() => {
    if (isAuthenticated() && activePlan && !completion && !isGenerating) {
      generateRecommendations().catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlan?.id]);

  // Handle regenerate button click
  const handleRegenerate = (): void => {
    generateRecommendations().catch(console.error);
  };

  // Format duration from seconds to mm:ss
  const formatDuration = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) {
      return "0:00";
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (!isAuthenticated()) {
    return null;
  }

  if (isLoadingUser || isLoadingActivities || isLoadingPlans) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="inline-block h-12 w-12 animate-spin text-blue-600" />
          <p className="mt-4 text-lg text-gray-700">Loading your data...</p>
        </div>
      </div>
    );
  }

  if (userError || activitiesError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md">
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Error Loading Data</AlertTitle>
            <AlertDescription>
              {(userError as Error)?.message ||
                (activitiesError as Error)?.message ||
                "Failed to load data"}
              <Button
                onClick={() => router.push("/login")}
                variant="destructive"
                className="mt-4 w-full"
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
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <Navigation user={user} />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || "Runner"}! 👋
          </h1>
          <p className="mt-1 text-gray-600">
            Here&apos;s your personalized training recommendation for this week
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Avg Pace */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Zap className="h-4 w-4 text-emerald-500" />
                Avg Pace
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5:12 /km</div>
            </CardContent>
          </Card>

          {/* Avg HR */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Heart className="h-4 w-4 text-orange-500 fill-orange-500" />
                Avg HR
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">152 bpm</div>
            </CardContent>
          </Card>

          {/* Weekly Distance */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Zap className="h-4 w-4 text-emerald-500" />
                Weekly Distance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">42.3 km</div>
            </CardContent>
          </Card>

          {/* Sleep Score */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Archive className="h-4 w-4 text-gray-600" />
                Sleep Score
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">82/100</div>
            </CardContent>
          </Card>
        </div>

        {/* AI-Generated Weekly Recommendation */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Weekly Training Recommendation</CardTitle>
              <Button
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="bg-orange-500 hover:bg-orange-600"
              >
                {isGenerating ? "Generating..." : "Regenerate"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Loading State */}
            {isGenerating && !completion && (
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-full"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3"></div>
              </div>
            )}

            {/* Error State */}
            {completionError && !completion && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertTitle>Failed to generate recommendation</AlertTitle>
                <AlertDescription>
                  {completionError.message}
                  <Button
                    onClick={handleRegenerate}
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
              <div className="prose prose-sm max-w-none prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:text-sm prose-p:leading-relaxed prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-strong:text-gray-900 prose-strong:font-semibold">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {completion}
                </ReactMarkdown>
              </div>
            )}

            {/* Empty State */}
            {!isGenerating && !completion && !completionError && (
              <div className="text-center py-8">
                <p className="text-sm text-gray-600">
                  Click &quot;Regenerate&quot; to get your personalized training
                  recommendation
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Recent Activities
          </h2>

          {activities.length === 0 ? (
            <Card className="p-12 text-center">
              <Archive className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold">
                No activities found
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                You haven&apos;t logged any activities in the last 30 days.
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {activities.map((activity: Activity) => (
                <Card
                  key={activity.id}
                  className="p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">
                        {activity.name}
                      </h3>
                      <p className="text-xs text-gray-600">{activity.type}</p>
                    </div>
                    {activity.averageHeartrate && (
                      <div className="ml-2 flex items-center gap-1 text-xs">
                        <Heart className="h-3.5 w-3.5 text-red-500 fill-red-500" />
                        <span className="font-medium text-gray-900">
                          {Math.round(activity.averageHeartrate)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Distance</span>
                      <span className="font-medium text-gray-900">
                        {(activity.distance / 1000).toFixed(2)} km
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium text-gray-900">
                        {formatDuration(activity.movingTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date</span>
                      <span className="font-medium text-gray-900">
                        {formatDate(activity.startDate)}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Training Plan Section */}
        <Card className="p-8">
          {activePlan ? (
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <CloudUpload className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Active Training Plan
              </h3>
              <p className="text-sm text-gray-900 font-medium mb-1">
                {activePlan.metadata.name}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Week {activePlan.currentWeek} of your training
              </p>
              {activePlan.metadata.goal && (
                <p className="text-sm text-gray-600 mb-4">
                  Goal: {activePlan.metadata.goal}
                </p>
              )}
              <Button
                variant="outline"
                onClick={() => setIsUploadDialogOpen(true)}
              >
                <CloudUpload className="mr-2 h-4 w-4" />
                Upload New Plan
              </Button>
            </div>
          ) : (
            <div className="text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <CloudUpload className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Upload Your Training Plan
              </h3>
              <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
                Upload your training schedule to get personalized weekly
                recommendations
              </p>
              <Button
                className="bg-orange-500 hover:bg-orange-600"
                onClick={() => setIsUploadDialogOpen(true)}
              >
                <CloudUpload className="mr-2 h-4 w-4" />
                Upload Plan
              </Button>
            </div>
          )}
        </Card>
      </main>

      {/* Upload Dialog */}
      <UploadTrainingPlanDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
      />
    </div>
  );
}
