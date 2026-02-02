'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { ExperienceLevel } from '@adaptive-training-plan/types';
import { ArrowLeft } from 'lucide-react';
import { ExperienceLevelSelector } from '@/components/ExperienceLevelSelector';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert } from '@/components/ui/alert';
import { useUserProfile, useUpdateExperienceLevel } from '@/hooks/use-user-profile';
import { useAuthGuard } from '@/hooks/use-auth-guard';

export default function ProfilePage() {
  // Protect route - redirect to login if not authenticated
  useAuthGuard();

  const { data: user, isLoading: isLoadingProfile } = useUserProfile();
  const updateExperienceLevel = useUpdateExperienceLevel();

  const [selectedLevel, setSelectedLevel] = useState<ExperienceLevel | undefined>(
    user?.experienceLevel
  );
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);

  // Update selected level when user data loads
  if (user && selectedLevel === undefined && user.experienceLevel) {
    setSelectedLevel(user.experienceLevel);
  }

  const handleSave = async () => {
    if (!selectedLevel) return;

    setShowSuccess(false);
    setShowError(false);

    try {
      await updateExperienceLevel.mutateAsync(selectedLevel);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    } catch (error) {
      console.error('Error updating experience level:', error);
      setShowError(true);
      setTimeout(() => setShowError(false), 5000);
    }
  };

  const hasChanged = selectedLevel !== user?.experienceLevel;

  if (isLoadingProfile) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>
        <h1 className="mb-6 text-3xl font-bold">Profile Settings</h1>
        <Card className="p-6">
          <div className="animate-pulse">
            <div className="mb-4 h-6 w-48 rounded bg-muted"></div>
            <div className="h-32 w-full rounded bg-muted"></div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <Link
        href="/dashboard"
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
      <h1 className="mb-6 text-3xl font-bold">Profile Settings</h1>

      {showSuccess && (
        <Alert className="mb-6 border-green-500 bg-green-50 text-green-800 dark:bg-green-950 dark:text-green-200">
          Experience level updated successfully!
        </Alert>
      )}

      {showError && (
        <Alert className="mb-6 border-red-500 bg-red-50 text-red-800 dark:bg-red-950 dark:text-red-200">
          Failed to update experience level. Please try again.
        </Alert>
      )}

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h2 className="mb-1 text-xl font-semibold">Running Experience Level</h2>
            <p className="text-sm text-muted-foreground">
              Select your running experience level to receive personalized training
              recommendations.
            </p>
          </div>

          <ExperienceLevelSelector
            value={selectedLevel}
            onChange={setSelectedLevel}
            disabled={updateExperienceLevel.isPending}
            required
          />

          <div className="flex items-center justify-between border-t pt-4">
            <p className="text-sm text-muted-foreground">
              {hasChanged
                ? 'You have unsaved changes'
                : selectedLevel
                  ? 'Your experience level is saved'
                  : 'Please select your experience level'}
            </p>
            <Button
              onClick={handleSave}
              disabled={!selectedLevel || !hasChanged || updateExperienceLevel.isPending}
            >
              {updateExperienceLevel.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
