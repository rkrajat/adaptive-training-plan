'use client';

import { useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    window.location.href = `${API_URL}/api/auth/strava`;
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">
            Adaptive Training Plan
          </h1>
          <p className="mt-3 text-base text-gray-600">
            AI-powered training adjustments based on your Strava data
          </p>
        </div>

        <div className="mt-8">
          <button
            onClick={handleLogin}
            disabled={isLoading}
            className="flex w-full items-center justify-center gap-3 rounded-md bg-[#FC4C02] px-4 py-3 text-base font-semibold text-white shadow-sm transition-colors hover:bg-[#E34402] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FC4C02] disabled:opacity-50 disabled:cursor-not-allowed"
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
                <span>Redirecting to Strava...</span>
              </>
            ) : (
              <>
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
                </svg>
                <span>Login with Strava</span>
              </>
            )}
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-gray-500">
          By logging in, you agree to connect your Strava account to access your training data.
        </p>
      </div>
    </div>
  );
}
