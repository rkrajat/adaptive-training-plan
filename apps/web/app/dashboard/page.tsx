'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import type { Activity, User } from '@adaptive-training-plan/types';

import { isAuthenticated } from '@/lib/auth';
import { activitiesApi, authApi } from '@/lib/api';
import { Navigation } from '@/components/Navigation';

export default function DashboardPage() {
  const router = useRouter();

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  // Fetch user profile
  const {
    data: user,
    isLoading: isLoadingUser,
    error: userError,
  } = useQuery<User>({
    queryKey: ['user'],
    queryFn: authApi.me,
    enabled: isAuthenticated(),
  });

  // Fetch activities
  const {
    data: activitiesData,
    isLoading: isLoadingActivities,
    error: activitiesError,
  } = useQuery({
    queryKey: ['activities'],
    queryFn: activitiesApi.list,
    enabled: isAuthenticated(),
  });

  const activities = activitiesData?.activities || [];

  // Format distance from meters to miles
  const formatDistance = (meters: number): string => {
    const miles = meters / 1609.34;
    return `${miles.toFixed(2)} mi`;
  };

  // Format duration from seconds to mm:ss
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (!isAuthenticated()) {
    return null;
  }

  if (isLoadingUser || isLoadingActivities) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-lg text-gray-700">Loading your data...</p>
        </div>
      </div>
    );
  }

  if (userError || activitiesError) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-red-50 p-6">
          <h3 className="text-lg font-semibold text-red-900">Error Loading Data</h3>
          <p className="mt-2 text-sm text-red-700">
            {(userError as Error)?.message || (activitiesError as Error)?.message || 'Failed to load data'}
          </p>
          <button
            onClick={() => router.push('/login')}
            className="mt-4 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <Navigation user={user} />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || 'Runner'}! 👋
          </h1>
          <p className="mt-1 text-gray-600">
            Here's your personalized training recommendation for this week
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Avg Pace */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Avg Pace
            </div>
            <div className="text-2xl font-bold text-gray-900">5:12 /km</div>
          </div>

          {/* Avg HR */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <svg className="h-4 w-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
              </svg>
              Avg HR
            </div>
            <div className="text-2xl font-bold text-gray-900">152 bpm</div>
          </div>

          {/* Weekly Distance */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Weekly Distance
            </div>
            <div className="text-2xl font-bold text-gray-900">42.3 km</div>
          </div>

          {/* Sleep Score */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <svg className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Sleep Score
            </div>
            <div className="text-2xl font-bold text-gray-900">82/100</div>
          </div>
        </div>

        {/* Week 4 Recommendation */}
        <div className="mb-8 rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Week 4 Recommendation</h2>
            <button className="rounded-md bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600 transition-colors">
              Regenerate
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-6">Target: 45 km total distance</p>

          {/* Performance Analysis */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Performance Analysis</h3>
            <p className="text-sm text-gray-700 leading-relaxed">
              Based on your recent performance data, you're recovering well from last week's long run. Your heart rate variability has
              improved, and your average pace is trending positively.
            </p>
          </div>

          {/* Recommended Adjustments */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">Recommended Adjustments</h3>
            <ol className="space-y-3">
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                  1
                </span>
                <span className="text-sm text-gray-700 pt-0.5">
                  Increase your long run distance by 2 km (from 16 km to 18 km)
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                  2
                </span>
                <span className="text-sm text-gray-700 pt-0.5">
                  Add one tempo run at marathon pace for 8 km
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                  3
                </span>
                <span className="text-sm text-gray-700 pt-0.5">
                  Keep easy runs truly easy - aim for 70-75% max heart rate
                </span>
              </li>
              <li className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold">
                  4
                </span>
                <span className="text-sm text-gray-700 pt-0.5">
                  Consider an extra rest day mid-week due to elevated fatigue markers
                </span>
              </li>
            </ol>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activities</h2>

          {activities.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                />
              </svg>
              <h3 className="mt-4 text-lg font-semibold text-gray-900">No activities found</h3>
              <p className="mt-2 text-sm text-gray-600">
                You haven't logged any activities in the last 30 days.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {activities.map((activity: Activity) => (
                <div
                  key={activity.id}
                  className="rounded-lg border border-gray-200 bg-white p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{activity.name}</h3>
                      <p className="text-xs text-gray-600">{activity.type}</p>
                    </div>
                    {activity.averageHeartrate && (
                      <div className="ml-2 flex items-center gap-1 text-xs">
                        <svg
                          className="h-3.5 w-3.5 text-red-500"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-medium text-gray-900">
                          {Math.round(activity.averageHeartrate)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Distance</span>
                      <span className="font-medium text-gray-900">{formatDistance(activity.distance)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium text-gray-900">{formatDuration(activity.movingTime)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date</span>
                      <span className="font-medium text-gray-900">{formatDate(activity.startDate)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Training Plan Section */}
        <div className="rounded-lg border border-gray-200 bg-white p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Upload Your Training Plan</h3>
          <p className="text-sm text-gray-600 mb-6 max-w-md mx-auto">
            Share your current training schedule to get more personalized weekly recommendations
          </p>
          <button className="inline-flex items-center gap-2 rounded-md bg-orange-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-orange-600 transition-colors">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload Plan
          </button>
        </div>
      </main>
    </div>
  );
}
