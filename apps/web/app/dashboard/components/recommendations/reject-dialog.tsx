"use client";

import { RefreshCw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { trackEvent, TELEMETRY_EVENTS } from "@/lib/telemetry";

import type { RejectAction } from "./types";

interface RejectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAction: (action: RejectAction) => void;
  isLoading: boolean;
}

/**
 * Dialog shown when user clicks reject button
 * Offers two options: Generate New or Discard
 */
export const RejectDialog = ({
  isOpen,
  onClose,
  onSelectAction,
  isLoading,
}: RejectDialogProps) => {
  const handleSelectAction = (action: RejectAction) => {
    trackEvent(TELEMETRY_EVENTS.RECOMMENDATION_REJECT_ACTION_SELECTED, {
      action,
    });
    onSelectAction(action);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject Recommendation</DialogTitle>
          <DialogDescription>
            What would you like to do with this recommendation?
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 py-4">
          <Button
            variant="outline"
            className="justify-start h-auto py-3 px-4"
            onClick={() => handleSelectAction("generate_new")}
            disabled={isLoading}
          >
            <RefreshCw className="h-5 w-5 mr-3 text-orange-500" />
            <div className="text-left">
              <div className="font-medium">Generate New</div>
              <div className="text-xs text-muted-foreground">
                Reject this and generate a fresh recommendation
              </div>
            </div>
          </Button>
          <Button
            variant="outline"
            className="justify-start h-auto py-3 px-4"
            onClick={() => handleSelectAction("discard")}
            disabled={isLoading}
          >
            <Trash2 className="h-5 w-5 mr-3 text-red-500" />
            <div className="text-left">
              <div className="font-medium">Discard</div>
              <div className="text-xs text-muted-foreground">
                Reject and return to empty state
              </div>
            </div>
          </Button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
