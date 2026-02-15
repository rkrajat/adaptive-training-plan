import { useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { isAuthenticated, getToken } from "@/lib/auth";
import { authApi, trainingPlansApi } from "@/lib/api";
import { getOnboardingStatus } from "@/lib/auth-utils";
import {
  trackEvent,
  setTelemetryUser,
  TELEMETRY_EVENTS,
} from "@/lib/telemetry";

export type AutoAuthState = "loading" | "unauthenticated" | "redirecting";

/**
 * Hook to automatically redirect authenticated users from landing page
 * to the appropriate destination (dashboard or onboarding)
 */
export const useAutoAuthRedirect = (): AutoAuthState => {
  const router = useRouter();
  const hasRedirected = useRef(false);

  // Check token synchronously - this determines if we should fetch
  const hasToken = useMemo(() => {
    if (typeof window === "undefined") return false;
    return isAuthenticated();
  }, []);

  // Only fetch if we have a token
  const userQuery = useQuery({
    queryKey: ["user"],
    queryFn: authApi.me,
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - same as dashboard
  });

  const activePlansQuery = useQuery({
    queryKey: ["trainingPlans", "active"],
    queryFn: trainingPlansApi.listActive,
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - same as dashboard
  });

  // Derive state from query states and hasToken
  const state = useMemo((): AutoAuthState => {
    // No token - immediately unauthenticated
    if (!hasToken) {
      return "unauthenticated";
    }

    // Still loading
    if (userQuery.isLoading || activePlansQuery.isLoading) {
      return "loading";
    }

    // Error fetching - treat as unauthenticated (token likely invalid)
    // The api.ts hook will clear invalid tokens on 401
    if (userQuery.isError || activePlansQuery.isError) {
      return "unauthenticated";
    }

    // Both queries succeeded - we're about to redirect
    if (userQuery.data && activePlansQuery.data) {
      return "redirecting";
    }

    // Default to loading
    return "loading";
  }, [
    hasToken,
    userQuery.isLoading,
    userQuery.isError,
    userQuery.data,
    activePlansQuery.isLoading,
    activePlansQuery.isError,
    activePlansQuery.data,
  ]);

  // Handle redirect when both queries succeed
  useEffect(() => {
    // Prevent double redirect in React strict mode
    if (hasRedirected.current) return;

    // Only redirect when we have successful data
    if (!userQuery.data || !activePlansQuery.data) return;

    hasRedirected.current = true;

    // Set up telemetry with user context
    const token = getToken();
    if (token) {
      setTelemetryUser(token);
    }

    const onboardingStatus = getOnboardingStatus(
      userQuery.data,
      activePlansQuery.data.plans,
    );

    const destination = onboardingStatus.isComplete
      ? "/dashboard"
      : "/onboarding";

    trackEvent(TELEMETRY_EVENTS.AUTO_AUTH_REDIRECT, {
      destination,
      onboarding_complete: onboardingStatus.isComplete,
    });

    router.push(destination);
  }, [userQuery.data, activePlansQuery.data, router]);

  return state;
};
