"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CloudUpload, Loader2, XCircle } from "lucide-react";
import type {
  ExperienceLevel,
  RaceGoalInput as RaceGoalInputType,
} from "@adaptive-training-plan/types";

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
import { ExperienceLevelSelector } from "@/components/ExperienceLevelSelector";
import { RaceGoalInput } from "@/components/RaceGoalInput";
import {
  useUserProfile,
  useUpdateExperienceLevel,
} from "@/hooks/use-user-profile";

interface UploadTrainingPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UploadTrainingPlanDialog = ({
  open,
  onOpenChange,
}: UploadTrainingPlanDialogProps) => {
  const queryClient = useQueryClient();
  const { data: user } = useUserProfile();
  const updateExperienceLevel = useUpdateExperienceLevel();

  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [goal, setGoal] = useState("");
  const [raceName, setRaceName] = useState("");
  const [raceDate, setRaceDate] = useState("");
  const [experienceLevel, setExperienceLevel] = useState<
    ExperienceLevel | undefined
  >(user?.experienceLevel);
  const [raceGoal, setRaceGoal] = useState<RaceGoalInputType | undefined>(undefined);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file || !name || !startDate || !experienceLevel || !raceGoal) {
        throw new Error(
          "Please provide a file, plan name, start date, race goal, and experience level"
        );
      }

      // Update experience level if it changed
      if (experienceLevel && experienceLevel !== user?.experienceLevel) {
        await updateExperienceLevel.mutateAsync(experienceLevel);
      }

      return trainingPlansApi.upload(file, {
        name,
        startDate,
        goal: goal || undefined,
        raceName: raceName || undefined,
        raceDate: raceDate || undefined,
        raceGoal,
      });
    },
    onSuccess: () => {
      // Invalidate training plans queries to refetch
      queryClient.invalidateQueries({ queryKey: ["trainingPlans"] });
      queryClient.invalidateQueries({ queryKey: ["trainingPlans", "active"] });
      // Reset form and close dialog
      resetForm();
      onOpenChange(false);
    },
  });

  const resetForm = () => {
    setFile(null);
    setName("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setGoal("");
    setRaceName("");
    setRaceDate("");
    setRaceGoal(undefined);
    if (user?.experienceLevel) {
      setExperienceLevel(user.experienceLevel);
    } else {
      setExperienceLevel(undefined);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Client-side file type validation
      const fileName = selectedFile.name.toLowerCase();
      const isValidExtension =
        fileName.endsWith(".csv") || fileName.endsWith(".pdf");

      if (!isValidExtension) {
        uploadMutation.reset();
        alert("Invalid file type. Please upload a CSV or PDF file.");
        e.target.value = "";
        return;
      }

      // Client-side file size validation
      const isPdf = fileName.endsWith(".pdf");
      const maxSize = isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024; // 10MB for PDF, 5MB for CSV
      const maxSizeLabel = isPdf ? "10MB" : "5MB";

      if (selectedFile.size > maxSize) {
        uploadMutation.reset();
        alert(
          `File size exceeds ${maxSizeLabel} limit. Please upload a smaller file.`
        );
        e.target.value = "";
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-[500px] max-h-[90vh] overflow-y-auto px-4 sm:px-6">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="px-0">
            <DialogTitle className="text-lg sm:text-xl">
              Upload Training Plan
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm">
              Upload your training plan in CSV or PDF format to get personalized
              recommendations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 sm:space-y-4 py-4">
            {/* File Upload */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="file" className="text-xs sm:text-sm">
                Training Plan File (CSV or PDF) *
              </Label>
              <Input
                id="file"
                type="file"
                accept=".csv,.pdf"
                onChange={handleFileChange}
                required
                className="text-xs sm:text-sm"
              />
              {file && (
                <p className="text-xs sm:text-sm text-muted-foreground break-words">
                  Selected: {file.name}
                  {file.name.toLowerCase().endsWith(".pdf") &&
                    " (PDF will be converted to CSV)"}
                </p>
              )}
            </div>

            {/* Plan Name */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="name" className="text-xs sm:text-sm">
                Plan Name *
              </Label>
              <Input
                id="name"
                placeholder="e.g., Marathon Training Plan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="text-xs sm:text-sm"
              />
            </div>

            {/* Start Date */}
            <div className="space-y-1.5 sm:space-y-2">
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

            {/* Race Goal - VDOT Calculation */}
            <div className="space-y-1.5 sm:space-y-2 pt-2 border-t">
              <Label className="text-xs sm:text-sm font-medium">
                Race Goal for Training Paces
              </Label>
              <p className="text-xs text-muted-foreground">
                If your training plan includes target paces, those will be used.
                Otherwise, paces will be calculated from your goal using the VDOT formula.
              </p>
              <RaceGoalInput
                value={raceGoal}
                onChange={setRaceGoal}
                disabled={uploadMutation.isPending}
              />
            </div>

            {/* Goal */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="goal" className="text-xs sm:text-sm">
                Goal (Optional)
              </Label>
              <Input
                id="goal"
                placeholder="e.g., Complete a marathon"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="text-xs sm:text-sm"
              />
            </div>

            {/* Race Name */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="raceName" className="text-xs sm:text-sm">
                Race Name (Optional)
              </Label>
              <Input
                id="raceName"
                placeholder="e.g., Boston Marathon"
                value={raceName}
                onChange={(e) => setRaceName(e.target.value)}
                className="text-xs sm:text-sm"
              />
            </div>

            {/* Race Date */}
            <div className="space-y-1.5 sm:space-y-2">
              <Label htmlFor="raceDate" className="text-xs sm:text-sm">
                Race Date (Optional)
              </Label>
              <Input
                id="raceDate"
                type="date"
                value={raceDate}
                onChange={(e) => setRaceDate(e.target.value)}
                className="text-xs sm:text-sm"
              />
            </div>

            {/* Experience Level */}
            <div className="space-y-1.5 sm:space-y-2 pt-2 border-t">
              <Label className="text-xs sm:text-sm">
                Running Experience Level
                <span className="ml-1 text-orange-600">*</span>
              </Label>
              <p className="text-xs text-muted-foreground">
                {user?.experienceLevel
                  ? "Current level selected. You can update it here if needed."
                  : "Please select your experience level to receive personalized recommendations."}
              </p>
              <ExperienceLevelSelector
                value={experienceLevel}
                onChange={setExperienceLevel}
                disabled={uploadMutation.isPending}
                required={!user?.experienceLevel}
              />
            </div>

            {/* Error Display */}
            {uploadMutation.isError && (
              <Alert variant="destructive" className="text-xs sm:text-sm">
                <XCircle className="h-4 w-4" />
                <AlertDescription className="break-words">
                  {uploadMutation.error?.message ||
                    "Failed to upload training plan"}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2 sm:gap-0 px-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploadMutation.isPending}
              className="w-full sm:w-auto order-2 sm:order-1"
              size="sm"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto order-1 sm:order-2"
              disabled={
                uploadMutation.isPending ||
                !file ||
                !name ||
                !startDate ||
                !experienceLevel ||
                !raceGoal
              }
              size="sm"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {file?.name.toLowerCase().endsWith(".pdf")
                    ? "Converting PDF..."
                    : "Uploading..."}
                </>
              ) : (
                <>
                  <CloudUpload className="mr-2 h-4 w-4" />
                  Upload Plan
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
