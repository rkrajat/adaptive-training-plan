import type {
  ActiveRecommendation,
  ActiveRecommendationResponse,
  AcceptRecommendationResponse,
  RejectAction,
  RejectRecommendationResponse,
} from "@adaptive-training-plan/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { recommendationsApi } from "@/lib/api";

/**
 * Query key factory for recommendation acceptance queries
 */
export const recommendationAcceptanceKeys = {
  all: ["recommendations"] as const,
  active: () => ["recommendations", "active"] as const,
};

/**
 * Hook to fetch user's active (accepted, non-expired) recommendation
 */
export const useActiveRecommendation = () => {
  return useQuery<ActiveRecommendationResponse, Error, ActiveRecommendation | null>({
    queryKey: recommendationAcceptanceKeys.active(),
    queryFn: () => recommendationsApi.getActive(),
    select: (data) => data.recommendation,
    staleTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
  });
};

/**
 * Hook to accept a recommendation
 * Automatically invalidates active recommendation query on success
 */
export const useAcceptRecommendation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    AcceptRecommendationResponse,
    Error,
    string, // recommendationId
    unknown
  >({
    mutationFn: (recommendationId: string) =>
      recommendationsApi.accept(recommendationId),
    onSuccess: () => {
      // Invalidate active recommendation query to refetch
      queryClient.invalidateQueries({
        queryKey: recommendationAcceptanceKeys.active(),
      });
    },
    onError: (error) => {
      console.error("Failed to accept recommendation:", error);
    },
  });
};

/**
 * Hook to reject a recommendation with an action
 * Returns the action taken for the caller to handle (generate_new or discard)
 */
export const useRejectRecommendation = () => {
  const queryClient = useQueryClient();

  return useMutation<
    RejectRecommendationResponse,
    Error,
    { recommendationId: string; action: RejectAction },
    unknown
  >({
    mutationFn: ({ recommendationId, action }) =>
      recommendationsApi.reject(recommendationId, action),
    onSuccess: () => {
      // Invalidate active recommendation query
      queryClient.invalidateQueries({
        queryKey: recommendationAcceptanceKeys.active(),
      });
    },
    onError: (error) => {
      console.error("Failed to reject recommendation:", error);
    },
  });
};
