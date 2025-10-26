'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import type { Activity, User } from '@adaptive-training-plan/types';

import { isAuthenticated } from '@/lib/auth';
import { activitiesApi, authApi } from '@/lib/api';

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
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#FC4C02] border-r-transparent"></div>
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
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            {user?.profilePhoto && (
              <img
                src={user.profilePhoto}
                alt={`${user.firstName} ${user.lastName}`}
                className="h-16 w-16 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-sm text-gray-600">Welcome to your training dashboard</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activities</h2>
          <p className="mt-1 text-sm text-gray-600">Your activities from the last 30 days</p>
        </div>

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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activities.map((activity: Activity) => (
              <div
                key={activity.id}
                className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{activity.name}</h3>
                    <p className="mt-1 text-sm text-gray-600">{activity.type}</p>
                  </div>
                  {activity.averageHeartrate && (
                    <div className="ml-4 text-right">
                      <svg
                        className="inline-block h-5 w-5 text-red-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="ml-1 text-sm font-medium text-gray-900">
                        {Math.round(activity.averageHeartrate)} bpm
                      </span>
                    </div>
                  )}
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Distance</span>
                    <span className="font-medium text-gray-900">{formatDistance(activity.distance)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-medium text-gray-900">{formatDuration(activity.movingTime)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Date</span>
                    <span className="font-medium text-gray-900">{formatDate(activity.startDate)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
