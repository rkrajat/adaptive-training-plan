"use client";

import { useQuery } from "@tanstack/react-query";

import { trainingStatusApi, type TrainingStatusResponse } from "@/lib/api";

interface UseTrainingStatusOptions {
  enabled?: boolean;
}

interface UseTrainingStatusReturn {
  data: TrainingStatusResponse | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch training status for the current user
 * Uses TanStack Query with 1-hour stale time for caching
 */
export const useTrainingStatus = ({
  enabled = true,
}: UseTrainingStatusOptions = {}): UseTrainingStatusReturn => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["trainingStatus"],
    queryFn: () => trainingStatusApi.getStatus(),
    enabled,
    staleTime: 60 * 60 * 1000, // 1 hour - training status doesn't change frequently
    refetchOnWindowFocus: false, // Don't refetch on tab focus (status is relatively stable)
    retry: 1, // Only retry once on failure
  });

  return {
    data,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};
