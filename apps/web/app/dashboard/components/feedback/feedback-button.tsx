'use client';

import { useState } from 'react';
import { MessageSquare, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';

import { useFeedbackStatus, useFeedbackSubmit } from '@/hooks/use-feedback';

import { FeedbackModal } from './feedback-modal';

import type { FeedbackFormData } from './types';

interface FeedbackButtonProps {
  recommendationId: string;
}

/**
 * Feedback Button Component
 * Displays button to trigger feedback modal and handles submission
 */
export const FeedbackButton = ({ recommendationId }: FeedbackButtonProps) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Query feedback status
  const { data: statusData, isLoading: isLoadingStatus } =
    useFeedbackStatus(recommendationId);

  // Mutation for submitting feedback
  const feedbackMutation = useFeedbackSubmit();

  const hasSubmitted = statusData?.hasSubmitted ?? false;

  const handleOpenModal = () => {
    if (!hasSubmitted) {
      setIsModalOpen(true);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = (formData: FeedbackFormData) => {
    feedbackMutation.mutate(
      {
        recommendationId,
        usefulnessRating: formData.rating,
        wouldFollow: formData.wouldFollow,
        comment: formData.comment,
      },
      {
        onSuccess: () => {
          toast.success('Thank you for your feedback!', {
            description: 'Your feedback helps us improve recommendations.',
          });
          handleCloseModal();
        },
        onError: (error) => {
          const errorMessage =
            error instanceof Error ? error.message : 'Failed to submit feedback';

          toast.error('Submission failed', {
            description: errorMessage,
          });
        },
      }
    );
  };

  // Loading state while checking status
  if (isLoadingStatus) {
    return (
      <Button
        disabled
        size="sm"
        variant="outline"
        className="gap-2"
        aria-label="Loading feedback status"
      >
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading...
      </Button>
    );
  }

  // Already submitted state
  if (hasSubmitted) {
    return (
      <Button
        disabled
        size="sm"
        variant="outline"
        className="gap-2 text-green-600 border-green-200 bg-green-50"
        aria-label="Feedback submitted"
      >
        <Check className="h-4 w-4" />
        Feedback Submitted
      </Button>
    );
  }

  // Default state - ready to submit feedback
  return (
    <>
      <Button
        onClick={handleOpenModal}
        size="sm"
        variant="outline"
        className="gap-2 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300"
        aria-label="Give feedback"
      >
        <MessageSquare className="h-4 w-4" />
        Give Feedback
      </Button>

      <FeedbackModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
        isSubmitting={feedbackMutation.isPending}
      />
    </>
  );
};
