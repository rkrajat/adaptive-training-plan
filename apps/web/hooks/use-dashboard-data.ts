import { useQuery } from "@tanstack/react-query";

import type {
  Activity,
  User,
  TrainingPlanWithContent,
} from "@adaptive-training-plan/types";

import { activitiesApi, authApi, trainingPlansApi } from "@/lib/api";

interface UseDashboardDataReturn {
  user: User | undefined;
  activities: Activity[];
  activePlan: TrainingPlanWithContent | undefined;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Custom hook to fetch all dashboard data (user, activities, training plans)
 * Centralizes all data fetching logic for the dashboard
 */
export const useDashboardData = (): UseDashboardDataReturn => {
  // Fetch user profile
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery<User>({
    queryKey: ["user"],
    queryFn: authApi.me,
  });

  // Fetch activities
  const {
    data: activitiesData,
    isLoading: isLoadingActivities,
    error: activitiesError,
  } = useQuery({
    queryKey: ["activities"],
    queryFn: activitiesApi.list,
  });

  // Fetch active training plan with content
  const {
    data: activePlanData,
    isLoading: isLoadingActivePlan,
    error: activePlanError,
  } = useQuery({
    queryKey: ["trainingPlans", "active"],
    queryFn: trainingPlansApi.listActive,
  });

  const activities = activitiesData?.activities || [];
  const activePlan = activePlanData?.plans[0];

  const isLoading = isLoadingUser || isLoadingActivities || isLoadingActivePlan;
  const error = (userError || activitiesError || activePlanError) as Error | null;

  return {
    user,
    activities,
    activePlan,
    isLoading,
    error,
  };
};
