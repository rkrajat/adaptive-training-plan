"use client";

import { useQuery } from "@tanstack/react-query";
import type { WeeklySummaryData } from "@adaptive-training-plan/types";

import { activitiesApi } from "@/lib/api";

interface UseWeeklySummaryOptions {
  startDate: string;
  currentWeek: number;
  enabled?: boolean;
}

interface UseWeeklySummaryReturn {
  data: WeeklySummaryData | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook to fetch weekly summary data for the runs report
 * Uses TanStack Query for caching and automatic refetching
 */
export const useWeeklySummary = ({
  startDate,
  currentWeek,
  enabled = true,
}: UseWeeklySummaryOptions): UseWeeklySummaryReturn => {
  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["weeklySummary", startDate, currentWeek],
    queryFn: () => activitiesApi.getWeeklySummary(startDate, currentWeek),
    enabled: enabled && !!startDate && currentWeek > 0,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: true, // Refetch when user returns to tab
  });

  return {
    data,
    isLoading,
    error: error as Error | null,
    refetch,
  };
};
