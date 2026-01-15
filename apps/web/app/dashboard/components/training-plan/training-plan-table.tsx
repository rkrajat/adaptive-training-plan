"use client";

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import {
  formatHeader,
  groupTrainingPlanByWeek,
} from "@adaptive-training-plan/utils";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TrainingPlanTableProps {
  csvContent: string;
  currentWeek: number;
  startDate: string;
}

/**
 * Training Plan Table component
 * Displays training plan data in a table format with collapsible weeks
 */
export const TrainingPlanTable = ({
  csvContent,
  currentWeek,
  startDate,
}: TrainingPlanTableProps) => {
  // Parse CSV content and group by week using shared utility
  const { headers, groupedWeeks, error } = useMemo(
    () => groupTrainingPlanByWeek(csvContent, startDate),
    [csvContent, startDate]
  );

  // Track which weeks are expanded (current week is expanded by default)
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(
    new Set([currentWeek])
  );

  const toggleWeek = (weekNumber: number) => {
    setExpandedWeeks((previous) => {
      const newSet = new Set(previous);
      if (newSet.has(weekNumber)) {
        newSet.delete(weekNumber);
      } else {
        newSet.add(weekNumber);
      }
      return newSet;
    });
  };

  // Handle errors
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-center">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  if (groupedWeeks.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-600">No training data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {groupedWeeks.map((week) => {
        const isExpanded = expandedWeeks.has(week.weekNumber);
        const isCurrentWeek = week.weekNumber === currentWeek;

        return (
          <Collapsible
            key={week.weekNumber}
            open={isExpanded}
            onOpenChange={() => toggleWeek(week.weekNumber)}
          >
            <div
              className={`rounded-lg border ${
                isCurrentWeek
                  ? "border-orange-300 bg-orange-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-50/50">
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="h-5 w-5 text-gray-600" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-gray-600" />
                  )}
                  <h3
                    className={`text-base font-semibold ${
                      isCurrentWeek ? "text-orange-900" : "text-gray-900"
                    }`}
                  >
                    Week {week.weekNumber}
                    {isCurrentWeek && (
                      <span className="ml-2 text-sm font-normal text-orange-700">
                        (Current Week)
                      </span>
                    )}
                  </h3>
                </div>
                <span className="text-sm text-gray-600">
                  {week.rows.length} {week.rows.length === 1 ? "day" : "days"}
                </span>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="overflow-x-auto border-t">
                  <Table>
                    <TableHeader className="bg-gray-100">
                      <TableRow>
                        {headers.map((header) => (
                          <TableHead
                            key={header}
                            className="whitespace-nowrap text-bold"
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
                            <TableCell
                              key={header}
                              className="whitespace-nowrap"
                            >
                              {row[header] || "-"}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
};
