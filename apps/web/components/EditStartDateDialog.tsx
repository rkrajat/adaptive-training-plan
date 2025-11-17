"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, Loader2, XCircle } from "lucide-react";
import { toast } from "sonner";

import { trainingPlansApi } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface EditStartDateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId: string;
  currentStartDate: string;
}

export const EditStartDateDialog = ({
  open,
  onOpenChange,
  planId,
  currentStartDate,
}: EditStartDateDialogProps) => {
  const queryClient = useQueryClient();
  const [startDate, setStartDate] = useState(currentStartDate.split("T")[0]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!startDate) {
        throw new Error("Please provide a start date");
      }

      return trainingPlansApi.updateStartDate(planId, startDate);
    },
    onSuccess: () => {
      // Invalidate queries to refetch updated plan
      queryClient.invalidateQueries({ queryKey: ["trainingPlans", "active"] });
      queryClient.invalidateQueries({ queryKey: ["trainingPlans"] });
      toast.success("Start date updated successfully!");
      onOpenChange(false);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Edit Start Date
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Update the start date of your training plan. Week numbers will be
              recalculated automatically.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-xs sm:text-sm">
                Training Plan Start Date *
              </Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="text-xs sm:text-sm"
              />
              <p className="text-xs text-muted-foreground">
                First day of your training plan
              </p>
            </div>

            {/* Error Display */}
            {updateMutation.isError && (
              <Alert variant="destructive" className="mt-4 text-xs sm:text-sm">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="break-words">
                  {updateMutation.error?.message || "Failed to update start date"}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateMutation.isPending}
              className="w-full sm:w-auto order-2 sm:order-1"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto order-1 sm:order-2"
              disabled={updateMutation.isPending || !startDate}
              size="sm"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Calendar className="mr-2 h-4 w-4" />
                  Update Start Date
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
