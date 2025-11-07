import { useEffect, useState } from "react";

import type { TrainingPlan } from "@adaptive-training-plan/types";

import { isAuthenticated } from "@/lib/auth";
import { recommendationsApi } from "@/lib/api";

interface UseRecommendationsReturn {
  completion: string;
  isGenerating: boolean;
  error: Error | null;
  generateRecommendations: (userFeedback?: string) => Promise<void>;
  handleRegenerate: () => void;
}

/**
 * Custom hook to handle AI recommendations generation with streaming
 * Automatically generates recommendations when a training plan is available
 */
export const useRecommendations = (
  activePlan: TrainingPlan | undefined
): UseRecommendationsReturn => {
  const [completion, setCompletion] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const generateRecommendations = async (
    userFeedback?: string
  ): Promise<void> => {
    setIsGenerating(true);
    setError(null);
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
      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        const chunk = decoder.decode(value, { stream: true });

        accumulated += chunk;
        setCompletion(accumulated);
      }
    } catch (err) {
      console.error("Error generating recommendations:", err);
      setError(err as Error);
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

  return {
    completion,
    isGenerating,
    error,
    generateRecommendations,
    handleRegenerate,
  };
};
