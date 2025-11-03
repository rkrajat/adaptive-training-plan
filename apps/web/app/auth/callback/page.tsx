'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { setToken } from '@/lib/auth';

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
    const token = searchParams.get('token');

    if (token) {
      setToken(token);
      router.push('/dashboard');
    } else {
      // No token found, redirect to login with error
      router.push('/login?error=no_token');
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
