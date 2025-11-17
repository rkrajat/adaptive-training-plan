import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { feedbackApi } from '@/lib/api';

import type {
  FeedbackSubmitRequest,
  FeedbackSubmitResponse,
  FeedbackStatusResponse,
} from '@/app/dashboard/components/feedback';

/**
 * Query key factory for feedback queries
 */
export const feedbackKeys = {
  all: ['feedback'] as const,
  status: (recommendationId: string) =>
    ['feedback', 'status', recommendationId] as const,
};

/**
 * Hook to check if user has submitted feedback for a recommendation
 */
export const useFeedbackStatus = (recommendationId: string) => {
  return useQuery<FeedbackStatusResponse>({
    queryKey: feedbackKeys.status(recommendationId),
    queryFn: async () => {
      return feedbackApi.checkFeedbackStatus(recommendationId);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!recommendationId, // Only run query if recommendationId is provided
  });
};

/**
 * Hook to submit feedback for a recommendation
 */
export const useFeedbackSubmit = () => {
  const queryClient = useQueryClient();

  return useMutation<
    FeedbackSubmitResponse,
    Error,
    FeedbackSubmitRequest,
    unknown
  >({
    mutationFn: async (data: FeedbackSubmitRequest) => {
      return feedbackApi.submitFeedback(data);
    },
    onSuccess: (_data, variables) => {
      // Invalidate and refetch feedback status query
      queryClient.invalidateQueries({
        queryKey: feedbackKeys.status(variables.recommendationId),
      });
    },
    onError: (error) => {
      console.error('Failed to submit feedback:', error);
    },
  });
};
