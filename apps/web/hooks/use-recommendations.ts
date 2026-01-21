import type {
  RecommendationStatus,
  TrainingPlan,
} from "@adaptive-training-plan/types";
import { useState } from "react";

import { recommendationsApi } from "@/lib/api";
import { extractRecommendationMetadata } from "@/lib/stream-utils";

interface UseRecommendationsReturn {
  completion: string;
  recommendationId: string | null;
  recommendationStatus: RecommendationStatus | undefined;
  isGenerating: boolean;
  error: Error | null;
  generateRecommendations: (userFeedback?: string) => Promise<void>;
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

      // Use the new endpoint with training plan
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
    handleRegenerate,
    setCompletion,
    setRecommendationId,
    setRecommendationStatus,
  };
};
