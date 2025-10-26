'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

import { setToken } from '@/lib/auth';

export default function CallbackPage() {
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#FC4C02] border-r-transparent"></div>
        <p className="mt-4 text-lg text-gray-700">Completing authentication...</p>
      </div>
    </div>
  );
}
