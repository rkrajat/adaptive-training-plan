'use client';

import { useState, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

import { StarRating } from './star-rating';

import type { FeedbackFormData } from './types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: FeedbackFormData) => void;
  isSubmitting: boolean;
}

/**
 * Feedback Modal Component
 * Collects user feedback on training recommendations
 */
export const FeedbackModal = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
}: FeedbackModalProps) => {
  const [rating, setRating] = useState<number>(0);
  const [wouldFollow, setWouldFollow] = useState<boolean>(false);
  const [comment, setComment] = useState<string>('');

  // Reset form and close modal
  const handleClose = useCallback(() => {
    setRating(0);
    setWouldFollow(false);
    setComment('');
    onClose();
  }, [onClose]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (rating === 0) {
      return; // Don't submit if no rating selected
    }

    const feedbackData: FeedbackFormData = {
      rating,
      wouldFollow,
      comment: comment.trim() || undefined,
    };

    onSubmit(feedbackData);
  };

  const isSubmitDisabled = rating === 0 || isSubmitting;
  const characterCount = comment.length;
  const maxCharacters = 1000;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>How was this recommendation?</DialogTitle>
            <DialogDescription>
              Help us improve by sharing your feedback on this training
              recommendation
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* Rating Section */}
            <div className="space-y-3">
              <Label htmlFor="rating" className="text-base font-semibold">
                How useful was this recommendation? *
              </Label>
              <div className="flex justify-center pt-2">
                <StarRating
                  value={rating}
                  onChange={setRating}
                  disabled={isSubmitting}
                />
              </div>
              {rating === 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  Please select a rating
                </p>
              )}
            </div>

            {/* Would Follow Section */}
            <div className="space-y-3">
              <Label htmlFor="would-follow" className="text-base font-semibold">
                Will you follow this recommendation? *
              </Label>
              <RadioGroup
                value={wouldFollow ? 'yes' : 'no'}
                onValueChange={(value) => setWouldFollow(value === 'yes')}
                disabled={isSubmitting}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="yes" id="follow-yes" />
                  <Label htmlFor="follow-yes" className="font-normal">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="no" id="follow-no" />
                  <Label htmlFor="follow-no" className="font-normal">
                    No
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Comment Section */}
            <div className="space-y-3">
              <Label htmlFor="comment" className="text-base font-semibold">
                Additional comments (optional)
              </Label>
              <Textarea
                id="comment"
                placeholder="Share any additional thoughts about this recommendation..."
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                disabled={isSubmitting}
                maxLength={maxCharacters}
                rows={4}
                className="resize-none"
              />
              <div className="flex justify-end">
                <span
                  className={`text-xs ${
                    characterCount > maxCharacters * 0.9
                      ? 'text-orange-600 font-semibold'
                      : 'text-muted-foreground'
                  }`}
                >
                  {characterCount} / {maxCharacters}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitDisabled}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
