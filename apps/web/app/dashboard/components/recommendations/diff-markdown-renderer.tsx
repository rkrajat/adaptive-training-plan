"use client";

import { Fragment, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import {
  extractModifiedPlanTable,
  compareTrainingPlans,
  createTableFromCsvData,
  groupTrainingPlanByWeek,
  type RowDiff,
} from "@adaptive-training-plan/utils";
import { cn } from "@/lib/utils";

interface OriginalPlanData {
  csvContent: string;
  currentWeek: number;
  startDate: string;
}

interface DiffMarkdownRendererProps {
  /** The markdown content from the LLM */
  markdown: string;
  /** Original training plan data for comparison */
  originalPlan?: OriginalPlanData;
}

/**
 * Column order mapping for reconstructing original row values
 */
const FIELD_KEY_ORDER = ["runType", "distance", "pace", "hrZone", "notes"];

/**
 * Fields to skip when showing changes (these never get strikethrough)
 */
const SKIP_CHANGE_FIELDS = ["hrZone"];

/**
 * Get original row values from diff data
 */
const getOriginalValues = (rowDiff: RowDiff): string[] => {
  return [
    rowDiff.date,
    rowDiff.day,
    ...FIELD_KEY_ORDER.map((fieldKey) => {
      const change = rowDiff.changes.find((chg) => chg.fieldKey === fieldKey);
      return change?.original || "";
    }),
  ];
};

/**
 * Format a day header from date and day name
 * e.g., "Monday, Feb 2"
 */
const formatDayHeader = (dateStr: string, dayName: string): string => {
  try {
    const date = new Date(dateStr);
    const month = date.toLocaleDateString("en-US", { month: "short" });
    const dayNum = date.getDate();
    // Capitalize the day name
    const capitalizedDay =
      dayName.charAt(0).toUpperCase() + dayName.slice(1).toLowerCase();
    return `${capitalizedDay}, ${month} ${dayNum}`;
  } catch {
    return `${dayName}`;
  }
};

/**
 * Legend component showing Original/Modified markers
 */
const DiffLegend = () => (
  <div className="flex gap-4 text-xs text-muted-foreground mb-2">
    <span className="flex items-center gap-1.5">
      <span className="w-3 h-3 border-l-4 border-red-400 bg-red-50 dark:bg-red-950/30" />
      Original
    </span>
    <span className="flex items-center gap-1.5">
      <span className="w-3 h-3 border-l-4 border-green-500 bg-green-50 dark:bg-green-950/30" />
      Modified
    </span>
  </div>
);

/**
 * Render the Modified Training Plan table with stacked rows for changes
 * - Changed days: Original row (red border + selective strikethrough) + Modified row (green border)
 * - Unchanged days: Single normal row
 * - New days: Single normal row
 * - Day headers separate each day visually
 */
const DiffTable = ({
  rowDiffs,
  tableMarkdown,
}: {
  rowDiffs: RowDiff[];
  tableMarkdown: string;
}) => {
  // Parse the table structure from markdown
  const lines = tableMarkdown
    .split("\n")
    .filter((line) => line.trim().length > 0 && line.includes("|"));

  if (lines.length < 3) return null;

  // First line is header
  const headerLine = lines[0];
  const headers = headerLine
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0);

  // Skip separator line (index 1), rest are data rows
  const dataLines = lines.slice(2);

  // Create a map of diffs by date for quick lookup
  const diffByDate = new Map<string, RowDiff>();
  for (const diff of rowDiffs) {
    diffByDate.set(diff.date, diff);
  }

  /**
   * Check if a cell has changed (excluding skipped fields like HR Zone)
   */
  const hasCellChanged = (rowDiff: RowDiff, cellIndex: number): boolean => {
    // First two columns are date and day - they never change
    if (cellIndex < 2) return false;

    const fieldKey = FIELD_KEY_ORDER[cellIndex - 2];
    if (!fieldKey) return false;

    // Skip certain fields from change tracking
    if (SKIP_CHANGE_FIELDS.includes(fieldKey)) return false;

    const change = rowDiff.changes.find((chg) => chg.fieldKey === fieldKey);
    return change !== undefined && change.changeType !== "unchanged";
  };

  return (
    <div className="overflow-x-auto">
      <DiffLegend />
      <table className="w-full text-xs sm:text-sm border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-2 py-2 text-left font-semibold text-foreground whitespace-nowrap"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataLines.map((line, rowIndex) => {
            const cells = line
              .split("|")
              .map((cell) => cell.trim())
              .filter((_, idx, arr) => idx !== 0 && idx !== arr.length - 1);

            // Get the date from the first cell to look up diff
            const dateCell = cells[0] || "";
            const normalizedDate = dateCell.trim();
            const rowDiff = diffByDate.get(normalizedDate);
            const dayName = cells[1] || "";

            // Day header row
            const dayHeader = (
              <tr key={`header-${rowIndex}`} className="bg-muted/30">
                <td
                  colSpan={headers.length}
                  className="px-2 py-1.5 font-medium text-sm text-muted-foreground"
                >
                  {formatDayHeader(normalizedDate, dayName)}
                </td>
              </tr>
            );

            // If row has changes and is NOT a new row, show original + modified
            if (rowDiff?.hasChanges && !rowDiff.isNewRow) {
              const originalValues = getOriginalValues(rowDiff);

              return (
                <Fragment key={rowIndex}>
                  {/* Day header */}
                  {dayHeader}
                  {/* Original row - red left border + selective strikethrough */}
                  <tr
                    className={cn(
                      "border-l-4 border-l-red-400 bg-red-50/50 dark:bg-red-950/20"
                    )}
                  >
                    {originalValues.map((value, cellIndex) => {
                      const cellChanged = hasCellChanged(rowDiff, cellIndex);
                      return (
                        <td key={cellIndex} className="px-2 py-1.5 align-top">
                          <span
                            className={cn(
                              cellChanged &&
                                "line-through text-muted-foreground opacity-60"
                            )}
                          >
                            {value || "-"}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                  {/* Modified row - green left border */}
                  <tr className="border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20 border-b border-border/50">
                    {cells.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-2 py-1.5 align-top">
                        <span>{cell}</span>
                      </td>
                    ))}
                  </tr>
                </Fragment>
              );
            }

            // Unchanged or new row - single row with day header
            return (
              <Fragment key={rowIndex}>
                {dayHeader}
                <tr className="border-b border-border/50">
                  {cells.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-2 py-2 align-top">
                      <span>{cell}</span>
                    </td>
                  ))}
                </tr>
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Custom markdown renderer that highlights changes in the Modified Training Plan table
 */
export const DiffMarkdownRenderer = ({
  markdown,
  originalPlan,
}: DiffMarkdownRendererProps) => {
  // Compute the diff if original plan is provided
  const diffResult = useMemo(() => {
    if (!originalPlan || !markdown) return null;

    // Extract the modified plan table from LLM output
    const modifiedTable = extractModifiedPlanTable(markdown);
    if (!modifiedTable) return null;

    // Get current week's data from original plan
    const { groupedWeeks, headers } = groupTrainingPlanByWeek(
      originalPlan.csvContent,
      originalPlan.startDate
    );

    const currentWeekData = groupedWeeks.find(
      (week) => week.weekNumber === originalPlan.currentWeek
    );

    if (!currentWeekData || currentWeekData.rows.length === 0) {
      return null;
    }

    // Create a table structure from original data
    const originalTable = createTableFromCsvData(currentWeekData.rows, headers);

    // Compare the plans
    const diff = compareTrainingPlans(originalTable, modifiedTable);

    return {
      diff,
      modifiedTable,
    };
  }, [markdown, originalPlan]);

  // Find the position of the Modified Training Plan table in markdown
  const tableSection = useMemo(() => {
    if (!markdown) return null;

    // Find the header
    const headerPatterns = [
      /###?\s*\ud83d\uddd3\ufe0f?\s*Modified Training Plan/i,
      /###?\s*Modified Training Plan/i,
    ];

    let headerMatch: RegExpMatchArray | null = null;
    for (const pattern of headerPatterns) {
      headerMatch = markdown.match(pattern);
      if (headerMatch) break;
    }

    if (!headerMatch || headerMatch.index === undefined) return null;

    // Find the table start (first line starting with |)
    const afterHeader = markdown.slice(headerMatch.index);
    const tableStartMatch = afterHeader.match(/\n\s*\|/);
    if (!tableStartMatch || tableStartMatch.index === undefined) return null;

    const tableStart = headerMatch.index + tableStartMatch.index + 1;

    // Find table end (look for non-table content or end)
    const tableContent = markdown.slice(tableStart);
    const lines = tableContent.split("\n");
    let tableEnd = tableStart;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith("|")) {
        tableEnd += line.length + 1;
      } else if (trimmed.length === 0) {
        tableEnd += line.length + 1;
      } else {
        break;
      }
    }

    return {
      headerStart: headerMatch.index,
      tableStart,
      tableEnd,
      tableMarkdown: markdown.slice(tableStart, tableEnd),
    };
  }, [markdown]);

  // If we have diff data and can identify the table section, split rendering
  if (diffResult && tableSection) {
    const beforeTable = markdown.slice(0, tableSection.headerStart);
    const afterTable = markdown.slice(tableSection.tableEnd);
    const headerText = markdown.slice(
      tableSection.headerStart,
      tableSection.tableStart
    );

    return (
      <div className="space-y-4">
        {/* Content before table */}
        {beforeTable.trim() && (
          <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {beforeTable}
            </ReactMarkdown>
          </div>
        )}

        {/* Table header */}
        <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{headerText}</ReactMarkdown>
        </div>

        {/* Custom diff table with stacked rows */}
        <DiffTable
          rowDiffs={diffResult.diff.rows}
          tableMarkdown={tableSection.tableMarkdown}
        />

        {/* Content after table */}
        {afterTable.trim() && (
          <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {afterTable}
            </ReactMarkdown>
          </div>
        )}
      </div>
    );
  }

  // Fallback: render markdown normally without diff highlighting
  return (
    <div className="prose prose-sm sm:prose-base max-w-none dark:prose-invert prose-headings:font-semibold prose-h1:text-lg sm:prose-h1:text-xl prose-h2:text-base sm:prose-h2:text-lg prose-h3:text-sm sm:prose-h3:text-base prose-p:text-xs sm:prose-p:text-sm prose-p:leading-relaxed prose-ul:my-2 prose-ol:my-2 prose-li:my-1 prose-strong:text-foreground prose-strong:font-semibold overflow-hidden break-words">
      <div className="overflow-x-auto break-words">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            p: ({ children }) => <p className="break-words">{children}</p>,
            li: ({ children }) => <li className="break-words">{children}</li>,
            code: ({ children, className }) => {
              const isInline = !className;
              return isInline ? (
                <code className="break-words bg-muted px-1 py-0.5 rounded text-xs">
                  {children}
                </code>
              ) : (
                <code className="block overflow-x-auto bg-muted p-2 rounded text-xs whitespace-pre">
                  {children}
                </code>
              );
            },
            pre: ({ children }) => (
              <pre className="overflow-x-auto bg-muted p-2 rounded text-xs whitespace-pre-wrap break-words">
                {children}
              </pre>
            ),
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
};
