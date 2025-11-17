"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar, CloudUpload, Trash2 } from "lucide-react";
import { toast } from "sonner";

import type { TrainingPlanWithContent } from "@adaptive-training-plan/types";

import { trainingPlansApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EditStartDateDialog } from "@/components/EditStartDateDialog";

import { TrainingPlanTable } from "./training-plan-table";

interface TrainingPlanSectionProps {
  activePlan?: TrainingPlanWithContent;
  onUploadClick: () => void;
}

/**
 * Section component to display training plan status and upload CTA
 * Shows different UI based on whether an active plan exists
 */
export const TrainingPlanSection = ({
  activePlan,
  onUploadClick,
}: TrainingPlanSectionProps) => {
  const queryClient = useQueryClient();
  const [isEditDateOpen, setIsEditDateOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!activePlan) return;
      return trainingPlansApi.delete(activePlan.id);
    },
    onSuccess: () => {
      // Invalidate queries to refetch plans
      queryClient.invalidateQueries({ queryKey: ["trainingPlans", "active"] });
      queryClient.invalidateQueries({ queryKey: ["trainingPlans"] });
      toast.success("Training plan deleted successfully!");
      setIsDeleteConfirmOpen(false);
    },
  });

  const handleDeleteConfirm = () => {
    deleteMutation.mutate();
  };

  return (
    <>
      <Card className="p-4 sm:p-8">
        {activePlan ? (
          <div>
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">
                  {activePlan.metadata.name}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Week {activePlan.currentWeek} of your training
                </p>
                {activePlan.metadata.goal && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Goal: {activePlan.metadata.goal}
                  </p>
                )}
              </div>
              <div className="hidden sm:flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDateOpen(true)}
                  size="sm"
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Edit Start Date
                </Button>
                <Button
                  variant="outline"
                  onClick={onUploadClick}
                  size="sm"
                >
                  <CloudUpload className="mr-2 h-4 w-4" />
                  Upload New Plan
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteConfirmOpen(true)}
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
            <TrainingPlanTable
              csvContent={activePlan.csvContent}
              currentWeek={activePlan.currentWeek}
              startDate={activePlan.startDate}
            />
            <div className="flex flex-col gap-2 sm:hidden mt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditDateOpen(true)}
                size="sm"
                className="w-full"
              >
                <Calendar className="mr-2 h-4 w-4" />
                Edit Start Date
              </Button>
              <Button
                variant="outline"
                onClick={onUploadClick}
                size="sm"
                className="w-full"
              >
                <CloudUpload className="mr-2 h-4 w-4" />
                Upload New Plan
              </Button>
              <Button
                variant="outline"
                onClick={() => setIsDeleteConfirmOpen(true)}
                size="sm"
                className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Plan
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3 sm:mb-4">
              <CloudUpload className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
            </div>
            <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
              Upload Your Training Plan
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto px-2">
              Upload your training schedule to get personalized weekly
              recommendations
            </p>
            <Button
              className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
              onClick={onUploadClick}
              size="sm"
            >
              <CloudUpload className="mr-2 h-4 w-4" />
              Upload Plan
            </Button>
          </div>
        )}
      </Card>

      {/* Edit Start Date Dialog */}
      {activePlan && (
        <EditStartDateDialog
          open={isEditDateOpen}
          onOpenChange={setIsEditDateOpen}
          planId={activePlan.id}
          currentStartDate={activePlan.startDate}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              Delete Training Plan
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Are you sure you want to delete this training plan? This action
              cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={deleteMutation.isPending}
              className="w-full sm:w-auto order-2 sm:order-1"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteMutation.isPending}
              className="w-full sm:w-auto order-1 sm:order-2"
              size="sm"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
