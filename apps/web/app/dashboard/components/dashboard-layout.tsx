import type { User } from "@adaptive-training-plan/types";

import { Navigation } from "@/components/Navigation";

interface DashboardLayoutProps {
  user: User | undefined;
  children: React.ReactNode;
}

/**
 * Layout component for the dashboard page
 * Provides consistent structure with navigation and content area
 */
export const DashboardLayout = ({ user, children }: DashboardLayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation user={user} />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-4 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName || "Runner"}! 👋
          </h1>
          <p className="mt-1 text-sm sm:text-base text-gray-600">
            Here&apos;s your personalized training recommendation for this week
          </p>
        </div>
        {children}
      </main>
    </div>
  );
};
