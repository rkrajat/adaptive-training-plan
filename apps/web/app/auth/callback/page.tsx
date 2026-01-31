'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { establishSession } from '@/lib/auth';

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
    // Prevent double processing in React strict mode
    if (hasProcessed.current) return;

    const processAuth = async () => {
      hasProcessed.current = true;

      const error = searchParams.get('error');
      const token = searchParams.get('token');

      if (error) {
        router.push(`/login?error=${error}`);
        return;
      }

      if (!token) {
        router.push('/login?error=no_token');
        return;
      }

      // Exchange token for HttpOnly cookie session
      const success = await establishSession(token);

      if (success) {
        router.push('/dashboard');
      } else {
        router.push('/login?error=session_failed');
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
