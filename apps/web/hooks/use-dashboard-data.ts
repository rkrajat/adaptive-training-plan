import { useQuery } from "@tanstack/react-query";

import type {
  Activity,
  User,
  TrainingPlan,
  TrainingPlanWithContent,
} from "@adaptive-training-plan/types";

import { isAuthenticated } from "@/lib/auth";
import { activitiesApi, authApi, trainingPlansApi } from "@/lib/api";

interface UseDashboardDataReturn {
  user: User | undefined;
  activities: Activity[];
  trainingPlans: TrainingPlan[];
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

  // Fetch training plans
  const {
    data: trainingPlansData,
    isLoading: isLoadingPlans,
    error: plansError,
  } = useQuery({
    queryKey: ["trainingPlans"],
    queryFn: trainingPlansApi.list,
    enabled: isAuthenticated(),
  });

  // Fetch active training plan with content
  const {
    data: activePlanData,
    isLoading: isLoadingActivePlan,
    error: activePlanError,
  } = useQuery({
    queryKey: ["trainingPlans", "active"],
    queryFn: trainingPlansApi.listActive,
    enabled: isAuthenticated(),
  });

  const activities = activitiesData?.activities || [];
  const trainingPlans = trainingPlansData?.plans || [];
  const activePlan = activePlanData?.plans[0];

  const isLoading =
    isLoadingUser || isLoadingActivities || isLoadingPlans || isLoadingActivePlan;
  const error = (userError ||
    activitiesError ||
    plansError ||
    activePlanError) as Error | null;

  return {
    user,
    activities,
    trainingPlans,
    activePlan,
    isLoading,
    error,
  };
};
