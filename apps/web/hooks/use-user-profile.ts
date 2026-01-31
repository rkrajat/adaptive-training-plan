import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ExperienceLevel, User } from '@adaptive-training-plan/types';
import { authApi, userApi } from '@/lib/api';

/**
 * Query key for user profile - shared with useDashboardData for cache consistency
 */
export const USER_PROFILE_QUERY_KEY = ['user'] as const;

/**
 * Hook to fetch user profile
 * Uses the same query key as useDashboardData to share cache
 */
export const useUserProfile = () => {
  return useQuery({
    queryKey: USER_PROFILE_QUERY_KEY,
    queryFn: authApi.me,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Hook to update user experience level with optimistic updates
 */
export const useUpdateExperienceLevel = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (experienceLevel: ExperienceLevel) => {
      const data = await userApi.updateExperienceLevel(experienceLevel);
      return data.user;
    },
    onMutate: async (experienceLevel: ExperienceLevel) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: USER_PROFILE_QUERY_KEY });

      // Snapshot the previous value
      const previousUser = queryClient.getQueryData<User>(USER_PROFILE_QUERY_KEY);

      // Optimistically update to the new value
      if (previousUser) {
        queryClient.setQueryData<User>(USER_PROFILE_QUERY_KEY, {
          ...previousUser,
          experienceLevel,
        });
      }

      // Return context with previous value for rollback
      return { previousUser };
    },
    onError: (_error, _experienceLevel, context) => {
      // Roll back to previous value on error
      if (context?.previousUser) {
        queryClient.setQueryData(USER_PROFILE_QUERY_KEY, context.previousUser);
      }
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: USER_PROFILE_QUERY_KEY });
    },
  });
};
