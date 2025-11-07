"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CloudUpload, Loader2, XCircle } from "lucide-react";

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

interface UploadTrainingPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UploadTrainingPlanDialog = ({
  open,
  onOpenChange,
}: UploadTrainingPlanDialogProps) => {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [raceName, setRaceName] = useState("");
  const [raceDate, setRaceDate] = useState("");
  const [raceDistance, setRaceDistance] = useState("");
  const [targetTime, setTargetTime] = useState("");

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file || !name) {
        throw new Error("Please provide a file and plan name");
      }

      return trainingPlansApi.upload(file, {
        name,
        goal: goal || undefined,
        raceName: raceName || undefined,
        raceDate: raceDate || undefined,
        raceDistance: raceDistance || undefined,
        targetTime: targetTime || undefined,
      });
    },
    onSuccess: () => {
      // Invalidate training plans query to refetch
      queryClient.invalidateQueries({ queryKey: ["trainingPlans"] });
      // Reset form and close dialog
      resetForm();
      onOpenChange(false);
    },
  });

  const resetForm = () => {
    setFile(null);
    setName("");
    setGoal("");
    setRaceName("");
    setRaceDate("");
    setRaceDistance("");
    setTargetTime("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    uploadMutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Upload Training Plan</DialogTitle>
            <DialogDescription>
              Upload your training plan in CSV format to get personalized
              recommendations
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file">CSV File *</Label>
              <Input
                id="file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                required
              />
              {file && (
                <p className="text-sm text-gray-600">
                  Selected: {file.name}
                </p>
              )}
            </div>

            {/* Plan Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Marathon Training Plan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            {/* Goal */}
            <div className="space-y-2">
              <Label htmlFor="goal">Goal (Optional)</Label>
              <Input
                id="goal"
                placeholder="e.g., Complete a marathon"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>

            {/* Race Name */}
            <div className="space-y-2">
              <Label htmlFor="raceName">Race Name (Optional)</Label>
              <Input
                id="raceName"
                placeholder="e.g., Boston Marathon"
                value={raceName}
                onChange={(e) => setRaceName(e.target.value)}
              />
            </div>

            {/* Race Date */}
            <div className="space-y-2">
              <Label htmlFor="raceDate">Race Date (Optional)</Label>
              <Input
                id="raceDate"
                type="date"
                value={raceDate}
                onChange={(e) => setRaceDate(e.target.value)}
              />
            </div>

            {/* Race Distance */}
            <div className="space-y-2">
              <Label htmlFor="raceDistance">Race Distance (Optional)</Label>
              <Input
                id="raceDistance"
                placeholder="e.g., 42.2km"
                value={raceDistance}
                onChange={(e) => setRaceDistance(e.target.value)}
              />
            </div>

            {/* Target Time */}
            <div className="space-y-2">
              <Label htmlFor="targetTime">Target Time (Optional)</Label>
              <Input
                id="targetTime"
                placeholder="e.g., 3:30:00"
                value={targetTime}
                onChange={(e) => setTargetTime(e.target.value)}
              />
            </div>

            {/* Error Display */}
            {uploadMutation.isError && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>
                  {uploadMutation.error?.message ||
                    "Failed to upload training plan"}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploadMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600"
              disabled={uploadMutation.isPending || !file || !name}
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
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
