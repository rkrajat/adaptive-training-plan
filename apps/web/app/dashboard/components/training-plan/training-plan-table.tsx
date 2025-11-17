'use client';

import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { parseCsvContent } from '@/lib/utils/csv-parser';

interface TrainingPlanTableProps {
  csvContent: string;
  currentWeek: number;
  startDate: string;
}

interface GroupedWeekData {
  weekNumber: number;
  rows: Record<string, string>[];
}

/**
 * Calculate week number from a date string and training plan start date
 */
const calculateWeekFromDate = (dateString: string, startDateString: string): number => {
  try {
    const rowDate = new Date(dateString);
    const startDate = new Date(startDateString);

    // Validate dates
    if (isNaN(rowDate.getTime()) || isNaN(startDate.getTime())) {
      return -1;
    }

    // Calculate difference in days
    const diffTime = rowDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Calculate week number (1-indexed)
    const weekNumber = Math.floor(diffDays / 7) + 1;

    // Handle dates before start date
    return weekNumber < 1 ? -1 : weekNumber;
  } catch {
    return -1;
  }
};

/**
 * Training Plan Table component
 * Displays training plan data in a table format with collapsible weeks
 */
export const TrainingPlanTable = ({
  csvContent,
  currentWeek,
  startDate,
}: TrainingPlanTableProps) => {
  // Parse CSV content and group by week
  const { headers, groupedWeeks, error } = useMemo(() => {
    try {
      const parsed = parseCsvContent(csvContent);

      // Try to find 'week' column first (case-insensitive)
      const weekHeader = parsed.headers.find(
        (header) => header.toLowerCase() === 'week'
      );

      // If no week column, try to find 'date' column for calculation
      const dateHeader = weekHeader
        ? null
        : parsed.headers.find((header) => header.toLowerCase() === 'date');

      // If neither week nor date column exists, return error
      if (!weekHeader && !dateHeader) {
        return {
          headers: [],
          groupedWeeks: [],
          error: 'CSV content must contain either a "week" or "date" column',
        };
      }

      // Group rows by week number
      const weekMap = new Map<number, Record<string, string>[]>();

      for (const row of parsed.rows) {
        let weekNumber: number;

        if (weekHeader) {
          // Use existing week column
          const weekValue = row[weekHeader];
          weekNumber = parseInt(weekValue, 10);

          if (isNaN(weekNumber)) {
            console.warn(`Invalid week number: ${weekValue}`);
            continue;
          }
        } else if (dateHeader) {
          // Calculate week from date
          const dateValue = row[dateHeader];
          weekNumber = calculateWeekFromDate(dateValue, startDate);

          if (weekNumber === -1) {
            console.warn(`Invalid date or date before start date: ${dateValue}`);
            continue;
          }
        } else {
          continue;
        }

        if (!weekMap.has(weekNumber)) {
          weekMap.set(weekNumber, []);
        }

        weekMap.get(weekNumber)?.push(row);
      }

      // Convert to sorted array
      const grouped: GroupedWeekData[] = Array.from(weekMap.entries())
        .map(([weekNumber, rows]) => ({
          weekNumber,
          rows,
        }))
        .sort((weekA, weekB) => weekA.weekNumber - weekB.weekNumber);

      return {
        headers: parsed.headers,
        groupedWeeks: grouped,
        error: null,
      };
    } catch (parseError) {
      return {
        headers: [],
        groupedWeeks: [],
        error:
          parseError instanceof Error
            ? parseError.message
            : 'Failed to parse CSV content',
      };
    }
  }, [csvContent, startDate]);

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
                  ? 'border-orange-300 bg-orange-50'
                  : 'border-gray-200 bg-white'
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
                      isCurrentWeek ? 'text-orange-900' : 'text-gray-900'
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
                  {week.rows.length} {week.rows.length === 1 ? 'day' : 'days'}
                </span>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="overflow-x-auto border-t">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {headers.map((header) => (
                          <TableHead key={header} className="whitespace-nowrap">
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {week.rows.map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {headers.map((header) => (
                            <TableCell key={header} className="whitespace-nowrap">
                              {row[header] || '-'}
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
