'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Zap, Loader2, ArrowLeft } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    window.location.href = `${API_URL}/api/auth/strava`;
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <Zap className="h-8 w-8 text-blue-600" />
        <span className="text-2xl font-bold text-gray-900">AdaptiveRunning</span>
      </div>

      <p className="mb-8 text-center text-gray-600">
        Connect your Strava account to get started
      </p>

      {/* Login Card */}
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-2">
          Welcome Back
        </h2>
        <p className="text-center text-sm text-gray-600 mb-6">
          Sign in with your Strava account to access your personalized training recommendations
        </p>

        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-[#FC4C02] px-4 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#E34402] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FC4C02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Connecting...</span>
            </>
          ) : (
            <>
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
              </svg>
              <span>Connect with Strava</span>
            </>
          )}
        </button>

        <p className="mt-4 text-center text-xs text-gray-500">
          By connecting, you agree to share your running data with AdaptiveRunning
        </p>
      </div>

      {/* Back to Home Link */}
      <Link
        href="/"
        className="mt-6 flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
    </div>
  );
}
