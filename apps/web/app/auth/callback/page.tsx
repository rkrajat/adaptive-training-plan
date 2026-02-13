'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { setToken } from '@/lib/auth';
import { authApi, trainingPlansApi } from '@/lib/api';
import { trackEvent, TELEMETRY_EVENTS } from '@/lib/telemetry';

const LoadingSpinner = () => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50">
    <div className="text-center">
      <Loader2 className="inline-block h-12 w-12 animate-spin text-[#FC4C02]" />
      <p className="mt-4 text-lg text-gray-700">Completing authentication...</p>
    </div>
  </div>
);

const CallbackContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const hasProcessed = useRef(false);

  useEffect(() => {
    const processAuth = async () => {
      // Prevent double processing in React strict mode
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      const error = searchParams.get('error');
      const token = searchParams.get('token');

      if (error) {
        trackEvent(TELEMETRY_EVENTS.AUTH_CALLBACK_ERROR, { error_type: error });
        router.push(`/login?error=${error}`);
        return;
      }

      if (!token) {
        trackEvent(TELEMETRY_EVENTS.AUTH_CALLBACK_ERROR, { error_type: 'no_token' });
        router.push('/login?error=no_token');
        return;
      }

      // Store token in localStorage
      setToken(token);
      trackEvent(TELEMETRY_EVENTS.AUTH_CALLBACK_SUCCESS);

      try {
        // Check if user has completed onboarding (has experience level and active plan)
        const [user, plansResponse] = await Promise.all([
          authApi.me(),
          trainingPlansApi.listActive(),
        ]);

        const hasExperienceLevel = !!user.experienceLevel;
        const hasActivePlan = plansResponse.plans.length > 0;

        // If onboarding is incomplete, redirect to onboarding
        if (!hasExperienceLevel || !hasActivePlan) {
          router.push('/onboarding');
          return;
        }

        // Otherwise, go to dashboard
        router.push('/dashboard');
      } catch (fetchError) {
        // If there's an error fetching user data, just go to dashboard
        // The dashboard will handle any errors
        console.error('Error checking onboarding status:', fetchError);
        router.push('/dashboard');
      }
    };

    processAuth();
  }, [searchParams, router]);

  return <LoadingSpinner />;
};

export default function CallbackPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CallbackContent />
    </Suspense>
  );
}
