import type {
  RecommendationStatus,
  TrainingPlan,
} from "@adaptive-training-plan/types";
import { useCallback, useState } from "react";

import { recommendationsApi } from "@/lib/api";
import { extractRecommendationMetadata } from "@/lib/stream-utils";

interface UseRecommendationsReturn {
  completion: string;
  recommendationId: string | null;
  recommendationStatus: RecommendationStatus | undefined;
  isGenerating: boolean;
  error: Error | null;
  generateRecommendations: (userFeedback?: string) => Promise<void>;
  preGenerateRecommendation: (planId: string) => Promise<void>;
  handleRegenerate: () => void;
  setCompletion: (content: string) => void;
  setRecommendationId: (id: string | null) => void;
  setRecommendationStatus: (status: RecommendationStatus | undefined) => void;
}

/**
 * Custom hook to handle AI recommendations generation with streaming
 * Recommendations are generated when the user explicitly requests them
 */
export const useRecommendations = (
  activePlan: TrainingPlan | undefined,
): UseRecommendationsReturn => {
  const [completion, setCompletion] = useState<string>("");
  const [recommendationId, setRecommendationId] = useState<string | null>(null);
  const [recommendationStatus, setRecommendationStatus] = useState<
    RecommendationStatus | undefined
  >(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const preGenerateRecommendation = useCallback(
    async (planId: string): Promise<void> => {
      try {
        // Pre-generate recommendation in background (generates and caches, or returns cached)
        // This is purely for cache pre-population - never updates UI state
        await recommendationsApi.preGenerate(planId);
      } catch (err) {
        console.error("Error pre-generating recommendation:", err);
        // Silently fail - this is just background cache pre-population
        // Don't set error state - graceful degradation (dashboard should still load)
      }
    },
    []
  );

  const generateRecommendations = async (
    userFeedback?: string,
  ): Promise<void> => {
    setIsGenerating(true);
    setError(null);
    setCompletion("");
    setRecommendationId(null);
    setRecommendationStatus(undefined);

    try {
      // Check if user has an active training plan
      if (!activePlan) {
        throw new Error(
          "Please upload a training plan first to get recommendations",
        );
      }

      // Use the new endpoint with training plan (which now fetches from cache)
      const response: Response = await recommendationsApi.generateWithPlan(
        activePlan.id,
        userFeedback,
      );

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("Response body is not readable");
      }

      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });

        accumulated += chunk;
        setCompletion(accumulated);
      }

      // Extract metadata (recommendation ID) from the streamed content
      const { recommendationId: recId, cleanContent } =
        extractRecommendationMetadata(accumulated);

      if (recId) {
        setRecommendationId(recId);
        // Update completion with clean content (metadata removed)
        setCompletion(cleanContent);
        // New recommendations start as pending
        setRecommendationStatus("pending");
      } else {
        // If no ID, it's from cache (not saved to DB yet)
        setRecommendationStatus("pending");
      }
    } catch (err) {
      console.error("Error generating recommendations:", err);
      setError(err as Error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle regenerate button click
  const handleRegenerate = (): void => {
    generateRecommendations().catch(console.error);
  };

  return {
    completion,
    recommendationId,
    recommendationStatus,
    isGenerating,
    error,
    generateRecommendations,
    preGenerateRecommendation,
    handleRegenerate,
    setCompletion,
    setRecommendationId,
    setRecommendationStatus,
  };
};
