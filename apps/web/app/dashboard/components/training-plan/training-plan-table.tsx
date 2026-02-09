"use client";

import { useMemo } from "react";
import {
  formatHeader,
  groupTrainingPlanByWeek,
} from "@adaptive-training-plan/utils";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface TrainingPlanTableProps {
  csvContent: string;
  currentWeek: number;
  startDate: string;
}

/**
 * Training Plan Table component
 * Displays training plan data in a tabs format with one tab per week
 */
export const TrainingPlanTable = ({
  csvContent,
  currentWeek,
  startDate,
}: TrainingPlanTableProps) => {
  // Parse CSV content and group by week using shared utility
  const { headers, groupedWeeks, error } = useMemo(
    () => groupTrainingPlanByWeek(csvContent, startDate),
    [csvContent, startDate],
  );

  // Handle errors
  if (error) {
    return (
      <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-center">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (groupedWeeks.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-muted p-4 text-center">
        <p className="text-sm text-muted-foreground">
          No training data available
        </p>
      </div>
    );
  }

  return (
    <Tabs defaultValue={`week-${currentWeek}`} className="w-full">
      <div className="overflow-x-auto pb-2">
        <TabsList className="inline-flex h-auto min-w-full gap-1 bg-muted/50 p-1">
          {groupedWeeks.map((week) => {
            const isCurrentWeek = week.weekNumber === currentWeek;
            return (
              <TabsTrigger
                key={week.weekNumber}
                value={`week-${week.weekNumber}`}
                className={cn(
                  "min-w-[60px] px-3 py-1.5 text-sm font-medium transition-all",
                  "data-[state=active]:shadow-sm",
                  isCurrentWeek &&
                    "data-[state=active]:bg-orange-500 data-[state=active]:text-white",
                  isCurrentWeek &&
                    "data-[state=inactive]:bg-orange-100 data-[state=inactive]:text-orange-700 dark:data-[state=inactive]:bg-orange-950/50 dark:data-[state=inactive]:text-orange-400",
                )}
              >
                W{week.weekNumber}
              </TabsTrigger>
            );
          })}
        </TabsList>
      </div>

      {groupedWeeks.map((week) => (
        <TabsContent
          key={week.weekNumber}
          value={`week-${week.weekNumber}`}
          className="mt-3"
        >
          <div
            className={cn(
              "rounded-lg border",
              week.weekNumber === currentWeek
                ? "border-orange-300 dark:border-orange-700"
                : "border-border",
            )}
          >
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted">
                  <TableRow>
                    {headers.map((header) => (
                      <TableHead
                        key={header}
                        className="whitespace-nowrap font-semibold"
                      >
                        {formatHeader(header)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {week.rows.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      {headers.map((header) => (
                        <TableCell key={header} className="whitespace-nowrap">
                          {row[header] || "-"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  );
};
