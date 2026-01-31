'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { isAuthenticated } from '@/lib/auth';

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

  useEffect(() => {
    const error = searchParams.get('error');

    if (error) {
      router.push(`/login?error=${error}`);
      return;
    }

    // Check if session cookie exists (set by backend during redirect)
    if (isAuthenticated()) {
      router.push('/dashboard');
    } else {
      // Cookie not set - auth failed
      router.push('/login?error=auth_failed');
    }
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
