"use client";

import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ReplaceConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}

/**
 * Warning dialog shown when generating a new recommendation
 * while an active (accepted) recommendation exists
 */
export const ReplaceConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
}: ReplaceConfirmationDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle>Replace Active Recommendation?</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            You already have an active recommendation for this week. Generating
            a new one will replace your current accepted recommendation.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
            className="bg-orange-500 hover:bg-orange-600"
          >
            {isLoading ? "Generating..." : "Generate New"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
