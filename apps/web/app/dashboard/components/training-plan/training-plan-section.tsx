import { CloudUpload } from "lucide-react";

import type { TrainingPlan } from "@adaptive-training-plan/types";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface TrainingPlanSectionProps {
  activePlan?: TrainingPlan;
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
  return (
    <Card className="p-4 sm:p-8">
      {activePlan ? (
        <div className="text-center">
          <div className="mx-auto w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-green-100 flex items-center justify-center mb-3 sm:mb-4">
            <CloudUpload className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
            Active Training Plan
          </h3>
          <p className="text-xs sm:text-sm text-gray-900 font-medium mb-1">
            {activePlan.metadata.name}
          </p>
          <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
            Week {activePlan.currentWeek} of your training
          </p>
          {activePlan.metadata.goal && (
            <p className="text-xs sm:text-sm text-gray-600 mb-3 sm:mb-4">
              Goal: {activePlan.metadata.goal}
            </p>
          )}
          <Button
            variant="outline"
            onClick={onUploadClick}
            size="sm"
            className="w-full sm:w-auto"
          >
            <CloudUpload className="mr-2 h-4 w-4" />
            Upload New Plan
          </Button>
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
  );
};
