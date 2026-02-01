import type { PaceGroup, PaceGroupTimeRange } from '@adaptive-training-plan/types';

import { parseCsvContent } from './csv-parser';

/**
 * Result of pace group parsing
 */
export interface PaceGroupParseResult {
  paceGroups: PaceGroup[];
  error: string | null;
}

/**
 * Parse time string to seconds
 * Handles formats like "2:00", "2:00:00", "2:00-2:20", "Finish Strong"
 */
const parseTimeToSeconds = (timeStr: string): number | null => {
  const trimmed = timeStr.trim();

  // Handle "Finish Strong" or similar non-time strings
  if (!/\d/.test(trimmed)) {
    return null;
  }

  // Handle range format "2:00-2:20"
  const rangeMatch = trimmed.match(/^(\d+:\d+(?::\d+)?)\s*-\s*(\d+:\d+(?::\d+)?)$/);
  if (rangeMatch) {
    // Use the first time for parsing
    return parseTimeToSeconds(rangeMatch[1]);
  }

  // Handle single time format "2:00" or "2:00:00"
  const parts = trimmed.split(':').map(Number);
  
  if (parts.length === 2) {
    // Format: MM:SS or HH:MM
    const [first, second] = parts;
    if (first < 24 && second < 60) {
      // Likely HH:MM format
      return first * 3600 + second * 60;
    }
    // Likely MM:SS format
    return first * 60 + second;
  }
  
  if (parts.length === 3) {
    // Format: HH:MM:SS
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }

  return null;
};

/**
 * Parse time range string to PaceGroupTimeRange
 * Handles formats like "2:00", "2:00-2:20", "< 2:00", "> 2:20", "Finish Strong"
 * Also handles text after time like "2:00 (HMP ≈5:40–5:50 min/km)"
 * 
 * @param timeStr - Time string to parse
 * @param isFirstGroup - Whether this is the first pace group (helps determine if "2:00" means "Sub 2:00")
 */
const parseTimeRange = (timeStr: string, isFirstGroup: boolean = false): PaceGroupTimeRange | null => {
  const trimmed = timeStr.trim();

  // Handle "Finish Strong" or similar non-time strings
  if (!/\d/.test(trimmed)) {
    return null; // No time range
  }

  // Extract time portion (before any parentheses or additional text)
  // Handle formats like "2:00 (HMP ≈5:40–5:50 min/km)" or "2:00–2:20 (HMP ≈6:10–6:30 min/km)"
  const timePortion = trimmed.split(/[\(\)]/)[0].trim();

  // Handle range format "2:00-2:20" or "2:00–2:20" (with en dash U+2013 or hyphen)
  const rangeMatch = timePortion.match(/^(\d+:\d+(?::\d+)?)\s*[–-]\s*(\d+:\d+(?::\d+)?)$/);
  if (rangeMatch) {
    const minSeconds = parseTimeToSeconds(rangeMatch[1]);
    const maxSeconds = parseTimeToSeconds(rangeMatch[2]);
    if (minSeconds !== null && maxSeconds !== null) {
      return { minSeconds, maxSeconds };
    }
  }

  // Handle "< 2:00" format
  const lessThanMatch = timePortion.match(/^<\s*(\d+:\d+(?::\d+)?)$/);
  if (lessThanMatch) {
    const maxSeconds = parseTimeToSeconds(lessThanMatch[1]);
    if (maxSeconds !== null) {
      return { maxSeconds };
    }
  }

  // Handle "> 2:00" format
  const greaterThanMatch = timePortion.match(/^>\s*(\d+:\d+(?::\d+)?)$/);
  if (greaterThanMatch) {
    const minSeconds = parseTimeToSeconds(greaterThanMatch[1]);
    if (minSeconds !== null) {
      return { minSeconds };
    }
  }

  // Handle single time format "2:00"
  // If it's the first group or contains "sub", treat as "Sub X" (max-only range)
  // Otherwise, treat as exact match
  const singleTimeMatch = timePortion.match(/^(\d+:\d+(?::\d+)?)$/);
  if (singleTimeMatch) {
    const timeSeconds = parseTimeToSeconds(singleTimeMatch[1]);
    if (timeSeconds !== null) {
      const lowerTrimmed = trimmed.toLowerCase();
      // Check if this appears to be a "sub X" format
      if (isFirstGroup || lowerTrimmed.includes('sub') || lowerTrimmed.startsWith('<')) {
        return { maxSeconds: timeSeconds };
      }
      // Otherwise, treat as exact match (min = max)
      return { minSeconds: timeSeconds, maxSeconds: timeSeconds };
    }
  }

  return null;
};

/**
 * Extract pace ranges from a pace description string
 * Handles formats like "HMP + 60-90 sec (6:40-7:10)" or "5:50-6:00"
 */
const extractPaceRange = (paceStr: string): string | undefined => {
  const trimmed = paceStr.trim();
  if (!trimmed) return undefined;

  // Look for pace range in parentheses: "(6:40-7:10)"
  const parenMatch = trimmed.match(/\(([^)]+)\)/);
  if (parenMatch) {
    return parenMatch[1].trim();
  }

  // Look for direct pace range format: "5:50-6:00"
  const directMatch = trimmed.match(/\d+:\d+\s*-\s*\d+:\d+/);
  if (directMatch) {
    return directMatch[0].trim();
  }

  // Return the whole string if it looks like a pace
  if (/\d+:\d+/.test(trimmed)) {
    return trimmed;
  }

  return undefined;
};

/**
 * Detect pace groups from CSV content
 * Supports multiple structures:
 * 1. Target Time row with pace groups in columns
 * 2. Paces row with pace ranges per group
 * 3. Multiple tables (one per pace group)
 * 4. Pace group column in each row
 */
export const detectPaceGroupsFromCsv = (
  csvContent: string
): PaceGroupParseResult => {
  try {
    const { headers, rows } = parseCsvContent(csvContent);
    const paceGroups: PaceGroup[] = [];

    // Strategy 1: Look for "Target Time" or "Paces" rows
    // These are typically metadata rows that define pace groups
    const targetTimeRowIndex = rows.findIndex((row) => {
      const firstCell = Object.values(row)[0]?.toLowerCase() || '';
      return (
        firstCell.includes('target time') ||
        firstCell.includes('target') ||
        firstCell.includes('pace group') ||
        firstCell.includes('group')
      );
    });

    const pacesRowIndex = rows.findIndex((row) => {
      const firstCell = Object.values(row)[0]?.toLowerCase() || '';
      return firstCell.includes('pace') && !firstCell.includes('target');
    });

    if (targetTimeRowIndex !== -1 || pacesRowIndex !== -1) {
      // Found metadata rows - extract pace groups from columns
      const targetTimeRow =
        targetTimeRowIndex !== -1 ? rows[targetTimeRowIndex] : null;
      const pacesRow = pacesRowIndex !== -1 ? rows[pacesRowIndex] : null;

      // Get column names (skip first column which is usually the row label)
      const columnKeys = headers.slice(1);

      for (let i = 0; i < columnKeys.length; i++) {
        const columnKey = columnKeys[i];
        const columnIndex = headers.indexOf(columnKey);

        // Extract time range from target time row
        const timeCell = targetTimeRow
          ? Object.values(targetTimeRow)[columnIndex] || ''
          : '';
        // Pass index to help determine if first group should be "sub X"
        const timeRange = timeCell ? parseTimeRange(timeCell, i === 0) : null;

        // Extract pace ranges from paces row
        const pacesCell = pacesRow
          ? Object.values(pacesRow)[columnIndex] || ''
          : '';
        const pacesText = pacesCell || '';

        // Parse pace ranges from the text
        const paces: Record<string, string> = {};
        const paceTypes = [
          'easy',
          'tempo',
          'interval',
          'long',
          'marathon',
          'threshold',
          'repetition',
          'warm',
          'cool',
        ];

        for (const paceType of paceTypes) {
          const regex = new RegExp(
            `${paceType}[^:]*:([^\\n]+)`,
            'gi'
          );
          const match = pacesText.match(regex);
          if (match) {
            const paceRange = extractPaceRange(match[0]);
            if (paceRange) {
              paces[paceType] = paceRange;
            }
          }
        }

        // If we found any pace information, create a pace group
        if (timeRange || Object.keys(paces).length > 0) {
          const groupName = timeCell || `Group ${i + 1}`;
          const groupId = `group-${i + 1}-${groupName.toLowerCase().replace(/\s+/g, '-')}`;

          paceGroups.push({
            id: groupId,
            name: groupName.trim(),
            timeRange: timeRange || undefined,
            paces: Object.keys(paces).length > 0 ? paces : {},
          });
        }
      }
    }

    // Strategy 2: Look for pace_group column
    const paceGroupColumnIndex = headers.findIndex(
      (header) =>
        header.toLowerCase().includes('pace_group') ||
        header.toLowerCase().includes('group')
    );

    if (paceGroupColumnIndex !== -1 && paceGroups.length === 0) {
      // Extract unique pace groups from the column
      const uniqueGroups = new Set<string>();
      rows.forEach((row) => {
        const groupValue = Object.values(row)[paceGroupColumnIndex];
        if (groupValue) {
          uniqueGroups.add(groupValue.trim());
        }
      });

      uniqueGroups.forEach((groupName, index) => {
        paceGroups.push({
          id: `group-${index + 1}-${groupName.toLowerCase().replace(/\s+/g, '-')}`,
          name: groupName,
          paces: {},
        });
      });
    }

    // If no pace groups detected, return empty array (backward compatibility)
    if (paceGroups.length === 0) {
      return {
        paceGroups: [],
        error: null,
      };
    }

    return {
      paceGroups,
      error: null,
    };
  } catch (error) {
    return {
      paceGroups: [],
      error:
        error instanceof Error
          ? error.message
          : 'Failed to parse pace groups from CSV',
    };
  }
};
