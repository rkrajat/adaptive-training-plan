"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Zap, Heart, Loader2, Archive, CloudUpload, XCircle } from "lucide-react";

import type { Activity, User } from "@adaptive-training-plan/types";

import { isAuthenticated } from "@/lib/auth";
import { activitiesApi, authApi, recommendationsApi } from "@/lib/api";
import { Navigation } from "@/components/Navigation";

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

  // State for AI-generated recommendations
  const [completion, setCompletion] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [completionError, setCompletionError] = useState<Error | null>(null);

  // Function to handle streaming recommendations
  const generateRecommendations = async (regenerate = false): Promise<void> => {
    setIsGenerating(true);
    setCompletionError(null);
    setCompletion("");

    try {
      const response = await recommendationsApi.generate(regenerate);

      if (!response.ok) {
        throw new Error(
          `Failed to generate recommendations: ${response.statusText}`
        );
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body is not readable");
      }

      let accumulated = "";
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();

        console.log("=======", {
          done,
          value,
        });

        if (done) {
          break;
        }

        console.log("=======", {
          done,
          value,
        });

        const chunk = decoder.decode(value, { stream: true });

        console.log("=======", {
          chunk,
        });

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

  // Auto-generate recommendations on mount (only once when user is authenticated)
  useEffect(() => {
    if (isAuthenticated() && !completion && !isGenerating) {
      generateRecommendations(false).catch(console.error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle regenerate button click
  const handleRegenerate = (): void => {
    generateRecommendations(true).catch(console.error);
  };

  // Format duration from seconds to mm:ss
  const formatDuration = (seconds: number): string => {
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

  if (isLoadingUser || isLoadingActivities) {
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
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-semibold text-red-900">
            Error Loading Data
          </h3>
          <p className="mt-2 text-sm text-red-700">
            {(userError as Error)?.message ||
              (activitiesError as Error)?.message ||
              "Failed to load data"}
          </p>
          <button
            onClick={() => router.push("/login")}
            className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Return to Login
          </button>
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
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Zap className="h-4 w-4 text-emerald-500" />
              Avg Pace
            </div>
            <div className="text-2xl font-bold text-gray-900">5:12 /km</div>
          </div>

          {/* Avg HR */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Heart className="h-4 w-4 text-orange-500 fill-orange-500" />
              Avg HR
            </div>
            <div className="text-2xl font-bold text-gray-900">152 bpm</div>
          </div>

          {/* Weekly Distance */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Zap className="h-4 w-4 text-emerald-500" />
              Weekly Distance
            </div>
            <div className="text-2xl font-bold text-gray-900">42.3 km</div>
          </div>

          {/* Sleep Score */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <Archive className="h-4 w-4 text-gray-600" />
              Sleep Score
            </div>
            <div className="text-2xl font-bold text-gray-900">82/100</div>
          </div>
        </div>

        {/* AI-Generated Weekly Recommendation */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">
              Weekly Training Recommendation
            </h2>
            <button
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? "Generating..." : "Regenerate"}
            </button>
          </div>

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
            <div className="rounded-md bg-red-50 border border-red-200 p-4">
              <div className="flex items-start gap-3">
                <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-red-900">
                    Failed to generate recommendation
                  </h3>
                  <p className="mt-1 text-sm text-red-700">
                    {completionError.message}
                  </p>
                  <button
                    onClick={handleRegenerate}
                    className="mt-3 text-sm font-medium text-red-700 hover:text-red-800"
                  >
                    Try again →
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Streaming/Completed Content */}
          {completion && (
            <div className="prose prose-sm max-w-none">
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {completion}
              </div>
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
        </div>

        {/* Recent Activities */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Recent Activities
          </h2>

          {activities.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
              <Archive className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                No activities found
              </h3>
              <p className="mt-2 text-sm text-gray-600">
                You haven&apos;t logged any activities in the last 30 days.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {activities.map((activity: Activity) => (
                <div
                  key={activity.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
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
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Training Plan Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <CloudUpload className="h-6 w-6 text-gray-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Upload Your Training Plan
          </h3>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            Share your current training schedule to get more personalized weekly
            recommendations
          </p>
          <button className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-600 transition-colors">
            <CloudUpload className="h-4 w-4" />
            Upload Plan
          </button>
        </div>
      </main>
    </div>
  );
}
