"use client";

import { useState, useCallback, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ExtractedTrainingPlanData,
  TrainingPlanRow,
  RaceGoalInput as RaceGoalInputType,
} from "@adaptive-training-plan/types";
import { AlertTriangle, Check, ChevronDown, Loader2 } from "lucide-react";

import { trainingPlansApi } from "@/lib/api";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { TrainingPlanRowEditor } from "@/components/TrainingPlanRowEditor";

interface ManualPlanCorrectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  extractedData: ExtractedTrainingPlanData;
  metadata: {
    name: string;
    startDate: string;
    goal?: string;
    raceName?: string;
    raceDate?: string;
    raceGoal: RaceGoalInputType;
  };
  onSuccess: () => void;
}

export const ManualPlanCorrectionDialog = ({
  open,
  onOpenChange,
  extractedData,
  metadata,
  onSuccess,
}: ManualPlanCorrectionDialogProps) => {
  const queryClient = useQueryClient();

  // Track corrected invalid rows
  const [correctedRows, setCorrectedRows] = useState<Map<number, TrainingPlanRow>>(
    new Map()
  );

  // Track validation state for each row
  const [rowValidation, setRowValidation] = useState<Map<number, boolean>>(
    new Map()
  );

  // Track whether valid rows section is expanded
  const [showValidRows, setShowValidRows] = useState(false);

  // Handle row update from editor
  const handleRowChange = useCallback(
    (rowIndex: number, updatedRow: TrainingPlanRow) => {
      setCorrectedRows((prev) => {
        const newMap = new Map(prev);
        newMap.set(rowIndex, updatedRow);
        return newMap;
      });
    },
    []
  );

  // Handle validation state change from editor
  const handleValidationChange = useCallback((rowIndex: number, isValid: boolean) => {
    setRowValidation((prev) => {
      const newMap = new Map(prev);
      newMap.set(rowIndex, isValid);
      return newMap;
    });
  }, []);

  // Check if all invalid rows are now valid
  const allRowsValid = useMemo(() => {
    return extractedData.invalidRows.every((invalid) =>
      rowValidation.get(invalid.rowIndex) === true
    );
  }, [extractedData.invalidRows, rowValidation]);

  // Build the final list of all rows (valid + corrected)
  const getAllRows = useCallback((): TrainingPlanRow[] => {
    // Start with valid rows
    const allRows: TrainingPlanRow[] = [...extractedData.validRows];

    // Add corrected rows
    for (const invalid of extractedData.invalidRows) {
      const correctedRow = correctedRows.get(invalid.rowIndex);
      if (correctedRow) {
        allRows.push(correctedRow);
      }
    }

    // Sort by date
    allRows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return allRows;
  }, [extractedData.validRows, extractedData.invalidRows, correctedRows]);

  // Submit mutation
  const submitMutation = useMutation({
    mutationFn: async () => {
      const rows = getAllRows();

      return trainingPlansApi.submitCorrected({
        ...metadata,
        rows,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trainingPlans"] });
      queryClient.invalidateQueries({ queryKey: ["trainingPlans", "active"] });
      onSuccess();
      onOpenChange(false);
    },
  });

  const handleSubmit = () => {
    if (allRowsValid) {
      submitMutation.mutate();
    }
  };

  return (
    <ResponsiveDialog
      open={open}
      onOpenChange={onOpenChange}
      preventClose={submitMutation.isPending}
    >
      <ResponsiveDialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle className="text-lg sm:text-xl">
            Review Extracted Training Plan
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription className="text-xs sm:text-sm">
            We extracted your training plan but found some issues. Please review and
            correct the highlighted rows.
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        {/* Summary Alert */}
        <Alert
          variant={allRowsValid ? "default" : "destructive"}
          className="my-2"
        >
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs sm:text-sm">
            {allRowsValid ? (
              <>
                <Check className="inline h-3 w-3 mr-1" />
                All {extractedData.totalRows} rows are now valid. Ready to save!
              </>
            ) : (
              <>
                {extractedData.invalidRowCount} of {extractedData.totalRows} rows
                need correction
              </>
            )}
          </AlertDescription>
        </Alert>

        <ScrollArea className="h-[50vh] pr-4">
          <div className="space-y-4">
            {/* Invalid Rows Section - Always Expanded */}
            {extractedData.invalidRows.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-red-600 dark:text-red-400">
                  Rows Requiring Correction ({extractedData.invalidRowCount})
                </h3>
                {extractedData.invalidRows.map((invalid) => (
                  <TrainingPlanRowEditor
                    key={invalid.rowIndex}
                    row={invalid.data}
                    rowIndex={invalid.rowIndex}
                    errors={invalid.errors}
                    onChange={(row) => handleRowChange(invalid.rowIndex, row)}
                    onValidationChange={handleValidationChange}
                  />
                ))}
              </div>
            )}

            {/* Valid Rows Section - Collapsible */}
            {extractedData.validRowCount > 0 && (
              <Collapsible open={showValidRows} onOpenChange={setShowValidRows}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-between text-sm text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20"
                  >
                    <span className="flex items-center">
                      <Check className="h-4 w-4 mr-2" />
                      Valid Rows ({extractedData.validRowCount})
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        showValidRows ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-2 py-1 text-left">Date</th>
                          <th className="px-2 py-1 text-left">Day</th>
                          <th className="px-2 py-1 text-left">Type</th>
                          <th className="px-2 py-1 text-right">Dist (km)</th>
                          <th className="px-2 py-1 text-left">Pace</th>
                          <th className="px-2 py-1 text-left">HR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extractedData.validRows.map((row, idx) => (
                          <tr key={idx} className="border-t">
                            <td className="px-2 py-1">{row.date}</td>
                            <td className="px-2 py-1">{row.day}</td>
                            <td className="px-2 py-1">{row.type}</td>
                            <td className="px-2 py-1 text-right">
                              {row.planned_distance_km}
                            </td>
                            <td className="px-2 py-1">
                              {row.target_pace_min_per_km || "-"}
                            </td>
                            <td className="px-2 py-1">
                              {row.target_HR_zone || "-"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </ScrollArea>

        {/* Error Display */}
        {submitMutation.isError && (
          <Alert variant="destructive" className="mt-2">
            <AlertDescription className="text-xs">
              {submitMutation.error?.message || "Failed to save training plan"}
            </AlertDescription>
          </Alert>
        )}

        <ResponsiveDialogFooter className="flex-col-reverse sm:flex-row gap-2 sm:gap-2 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitMutation.isPending}
            className="w-full sm:w-auto"
            size="sm"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!allRowsValid || submitMutation.isPending}
            className="bg-orange-500 hover:bg-orange-600 w-full sm:w-auto"
            size="sm"
          >
            {submitMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>Save Corrected Plan</>
            )}
          </Button>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
};
