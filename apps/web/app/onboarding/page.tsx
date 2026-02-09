"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CloudUpload,
  Loader2,
  SkipForward,
  Target,
  User,
} from "lucide-react";

import type {
  ExperienceLevel,
  RaceGoalInput as RaceGoalInputType,
} from "@adaptive-training-plan/types";

import { useAuthGuard } from "@/hooks/use-auth-guard";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { useUpdateExperienceLevel } from "@/hooks/use-user-profile";
import { trainingPlansApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ExperienceLevelSelector } from "@/components/ExperienceLevelSelector";
import { RaceGoalInput } from "@/components/RaceGoalInput";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "Experience", icon: User },
  { id: 2, title: "Race Goal", icon: Target },
  { id: 3, title: "Training Plan", icon: CloudUpload },
];

export default function OnboardingPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  // Protect route
  useAuthGuard();

  const { user, activePlan, isLoading } = useDashboardData();
  const updateExperienceLevel = useUpdateExperienceLevel();

  // Step state
  const [currentStep, setCurrentStep] = useState(1);

  // Form state - derive initial value from user data
  const initialExperienceLevel = user?.experienceLevel;
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | undefined>(undefined);
  const [raceGoal, setRaceGoal] = useState<RaceGoalInputType | undefined>(undefined);

  // Training plan form state
  const [file, setFile] = useState<File | null>(null);
  const [planName, setPlanName] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [goal, setGoal] = useState("");
  const [raceName, setRaceName] = useState("");
  const [raceDate, setRaceDate] = useState("");

  // Use the user's experience level as default if not yet set locally
  const effectiveExperienceLevel = experienceLevel ?? initialExperienceLevel;

  // Redirect to dashboard if onboarding is complete
  useEffect(() => {
    if (!isLoading && user) {
      // Check if onboarding is complete (has experience level AND has active plan)
      if (user.experienceLevel && activePlan) {
        router.push("/dashboard");
      }
    }
  }, [isLoading, user, activePlan, router]);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file || !planName || !startDate || !raceGoal) {
        throw new Error("Please fill in all required fields");
      }

      // First update experience level if needed
      if (effectiveExperienceLevel && effectiveExperienceLevel !== user?.experienceLevel) {
        await updateExperienceLevel.mutateAsync(effectiveExperienceLevel);
      }

      return trainingPlansApi.upload(file, {
        name: planName,
        startDate,
        goal: goal || undefined,
        raceName: raceName || undefined,
        raceDate: raceDate || undefined,
        raceGoal,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainingPlans"] });
      queryClient.invalidateQueries({ queryKey: ["trainingPlans", "active"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.push("/dashboard");
    },
  });

  // Save experience level mutation
  const saveExperienceLevelOnly = async () => {
    if (effectiveExperienceLevel && effectiveExperienceLevel !== user?.experienceLevel) {
      await updateExperienceLevel.mutateAsync(effectiveExperienceLevel);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const fileName = selectedFile.name.toLowerCase();
      const isValidExtension = fileName.endsWith(".csv") || fileName.endsWith(".pdf");

      if (!isValidExtension) {
        alert("Invalid file type. Please upload a CSV or PDF file.");
        event.target.value = "";
        return;
      }

      const isPdf = fileName.endsWith(".pdf");
      const maxSize = isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
      const maxSizeLabel = isPdf ? "10MB" : "5MB";

      if (selectedFile.size > maxSize) {
        alert(`File size exceeds ${maxSizeLabel} limit.`);
        event.target.value = "";
        return;
      }

      setFile(selectedFile);
    }
  };

  const handleNext = async () => {
    if (currentStep === 1 && effectiveExperienceLevel) {
      await saveExperienceLevelOnly();
      setCurrentStep(2);
    } else if (currentStep === 2) {
      setCurrentStep(3);
    } else if (currentStep === 3) {
      uploadMutation.mutate();
    }
  };

  const handleSkip = () => {
    // Save experience level if set
    if (effectiveExperienceLevel && effectiveExperienceLevel !== user?.experienceLevel) {
      saveExperienceLevelOnly();
    }
    router.push("/dashboard");
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!effectiveExperienceLevel;
      case 2:
        return !!raceGoal;
      case 3:
        return !!file && !!planName && !!startDate && !!raceGoal && !!effectiveExperienceLevel;
      default:
        return false;
    }
  };

  const progressValue = ((currentStep - 1) / (STEPS.length - 1)) * 100;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-background dark:from-orange-950/20 dark:to-background py-8 px-4">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">
            Welcome to Adaptive Training
          </h1>
          <p className="text-muted-foreground">
            Let&apos;s set up your personalized training experience
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;

              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
                      isCompleted
                        ? "bg-green-500 text-white"
                        : isActive
                          ? "bg-orange-500 text-white"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <Icon className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-xs font-medium",
                      isActive ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.title}
                  </span>
                  {index < STEPS.length - 1 && (
                    <div
                      className={cn(
                        "absolute h-0.5 w-full max-w-[100px]",
                        isCompleted ? "bg-green-500" : "bg-muted"
                      )}
                      style={{
                        left: `calc(${(index + 0.5) * (100 / STEPS.length)}% + 20px)`,
                        top: "20px",
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <Progress value={progressValue} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              {currentStep === 1 && "What's your running experience?"}
              {currentStep === 2 && "What's your race goal?"}
              {currentStep === 3 && "Upload your training plan"}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 &&
                "This helps us tailor recommendations to your fitness level and running background."}
              {currentStep === 2 &&
                "Your race goal helps us calculate training paces using VDOT methodology."}
              {currentStep === 3 &&
                "Upload your training plan in CSV or PDF format. We'll help you optimize it week by week."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Experience Level */}
            {currentStep === 1 && (
              <ExperienceLevelSelector
                value={effectiveExperienceLevel}
                onChange={setExperienceLevel}
                disabled={updateExperienceLevel.isPending}
              />
            )}

            {/* Step 2: Race Goal */}
            {currentStep === 2 && (
              <RaceGoalInput
                value={raceGoal}
                onChange={setRaceGoal}
                disabled={false}
              />
            )}

            {/* Step 3: Training Plan Upload */}
            {currentStep === 3 && (
              <div className="space-y-4">
                {/* File Upload */}
                <div className="space-y-2">
                  <Label htmlFor="file">
                    Training Plan File (CSV or PDF)
                    <span className="ml-1 text-orange-600">*</span>
                  </Label>
                  <Input
                    id="file"
                    type="file"
                    accept=".csv,.pdf"
                    onChange={handleFileChange}
                  />
                  {file && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {file.name}
                      {file.name.toLowerCase().endsWith(".pdf") && " (PDF will be converted)"}
                    </p>
                  )}
                </div>

                {/* Plan Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Plan Name
                    <span className="ml-1 text-orange-600">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Marathon Training Plan"
                    value={planName}
                    onChange={(event) => setPlanName(event.target.value)}
                  />
                </div>

                {/* Start Date */}
                <div className="space-y-2">
                  <Label htmlFor="startDate">
                    Training Start Date
                    <span className="ml-1 text-orange-600">*</span>
                  </Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={startDate}
                    onChange={(event) => setStartDate(event.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    The first day of your training plan
                  </p>
                </div>

                {/* Optional fields */}
                <div className="space-y-2">
                  <Label htmlFor="goal">Goal (Optional)</Label>
                  <Input
                    id="goal"
                    placeholder="e.g., Complete my first marathon"
                    value={goal}
                    onChange={(event) => setGoal(event.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="raceName">Race Name (Optional)</Label>
                    <Input
                      id="raceName"
                      placeholder="e.g., Boston Marathon"
                      value={raceName}
                      onChange={(event) => setRaceName(event.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="raceDate">Race Date (Optional)</Label>
                    <Input
                      id="raceDate"
                      type="date"
                      value={raceDate}
                      onChange={(event) => setRaceDate(event.target.value)}
                    />
                  </div>
                </div>

                {/* Error Display */}
                {uploadMutation.isError && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {uploadMutation.error?.message || "Failed to upload training plan"}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={uploadMutation.isPending}
              >
                <ChevronLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              onClick={handleSkip}
              disabled={uploadMutation.isPending}
              className="text-muted-foreground"
            >
              <SkipForward className="mr-2 h-4 w-4" />
              Skip for now
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed() || uploadMutation.isPending || updateExperienceLevel.isPending}
              className="bg-orange-500 hover:bg-orange-600"
            >
              {uploadMutation.isPending || updateExperienceLevel.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {currentStep === 3 ? "Uploading..." : "Saving..."}
                </>
              ) : currentStep === STEPS.length ? (
                <>
                  Complete Setup
                  <CheckCircle2 className="ml-2 h-4 w-4" />
                </>
              ) : (
                <>
                  Continue
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Helper Text */}
        <p className="mt-6 text-center text-xs text-muted-foreground">
          You can always update these settings later from your dashboard.
        </p>
      </div>
    </div>
  );
}
