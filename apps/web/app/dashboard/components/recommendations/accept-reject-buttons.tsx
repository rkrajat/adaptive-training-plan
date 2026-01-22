"use client";

import { Check, X, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

interface AcceptRejectButtonsProps {
  onAccept: () => void;
  onReject: () => void;
  isAccepting: boolean;
  isRejecting: boolean;
  disabled?: boolean;
}

/**
 * Button pair for accepting or rejecting a recommendation
 * Accept: Green-tinted outline button with checkmark
 * Reject: Red-tinted outline button with X
 */
export const AcceptRejectButtons = ({
  onAccept,
  onReject,
  isAccepting,
  isRejecting,
  disabled = false,
}: AcceptRejectButtonsProps) => {
  const isLoading = isAccepting || isRejecting;

  return (
    <div className="flex gap-2" data-tour="accept-reject-buttons">
      <Button
        variant="outline"
        size="sm"
        onClick={onAccept}
        disabled={disabled || isLoading}
        className="border-green-500/50 text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-500 dark:border-green-500/30 dark:text-green-400 dark:hover:bg-green-950 dark:hover:text-green-300"
      >
        {isAccepting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Check className="h-4 w-4" />
        )}
        <span className="sr-only sm:not-sr-only sm:ml-1">Accept</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onReject}
        disabled={disabled || isLoading}
        className="border-red-500/50 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-500 dark:border-red-500/30 dark:text-red-400 dark:hover:bg-red-950 dark:hover:text-red-300"
      >
        {isRejecting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <X className="h-4 w-4" />
        )}
        <span className="sr-only sm:not-sr-only sm:ml-1">Reject</span>
      </Button>
    </div>
  );
};
