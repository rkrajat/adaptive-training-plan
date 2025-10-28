'use client';

import Link from 'next/link';
import { useState } from 'react';

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
        <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
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
              <svg
                className="h-5 w-5 animate-spin text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
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
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </Link>
    </div>
  );
}
