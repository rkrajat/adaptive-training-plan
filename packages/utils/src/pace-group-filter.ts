import type { PaceGroup } from '@adaptive-training-plan/types';
import { parseCsvContent } from './csv-parser';

/**
 * Map run type to pace group pace type
 */
const mapRunTypeToPaceType = (runType: string): keyof PaceGroup['paces'] | null => {
  const runTypeLower = runType.toLowerCase();
  
  if (runTypeLower.includes('easy') || runTypeLower.includes('recovery')) {
    return 'easy';
  } else if (runTypeLower.includes('tempo') || runTypeLower.includes('threshold')) {
    return 'tempo';
  } else if (runTypeLower.includes('interval')) {
    return 'interval';
  } else if (runTypeLower.includes('long') || runTypeLower.includes('long run')) {
    return 'longRun';
  } else if (runTypeLower.includes('marathon')) {
    return 'marathon';
  } else if (runTypeLower.includes('repetition')) {
    return 'repetition';
  } else if (runTypeLower.includes('warm')) {
    return 'warmUp';
  } else if (runTypeLower.includes('cool')) {
    return 'coolDown';
  }
  
  return null;
};

/**
 * Update CSV content to use matched pace group's paces
 * Replaces target_pace_min_per_km values based on run type and matched pace group
 * 
 * @param csvContent - Original CSV content
 * @param matchedPaceGroup - Matched pace group with paces
 * @returns Updated CSV content with pace values from matched pace group
 */
export const updateCsvWithMatchedPaceGroup = (
  csvContent: string,
  matchedPaceGroup: PaceGroup
): string => {
  if (!matchedPaceGroup || !matchedPaceGroup.paces) {
    return csvContent;
  }

  try {
    const { headers, rows } = parseCsvContent(csvContent);
    
    // Find the pace column index
    const paceColumnIndex = headers.findIndex(
      (h) => h.toLowerCase().includes('pace') && h.toLowerCase().includes('target')
    );
    
    // Find the type column index
    const typeColumnIndex = headers.findIndex(
      (h) => h.toLowerCase() === 'type' || h.toLowerCase().includes('run_type')
    );

    if (paceColumnIndex === -1 || typeColumnIndex === -1) {
      // Can't update if we don't have the required columns
      return csvContent;
    }

    const paceColumn = headers[paceColumnIndex];
    const typeColumn = headers[typeColumnIndex];

    // Update rows with matched pace group paces
    const updatedRows = rows.map((row) => {
      const runType = row[typeColumn] || '';
      
      // Skip metadata rows (Target Time, Paces, etc.)
      const firstCell = Object.values(row)[0]?.toLowerCase() || '';
      if (
        firstCell.includes('target time') ||
        firstCell.includes('target') ||
        firstCell.includes('pace') ||
        firstCell.includes('pace group') ||
        firstCell.includes('group')
      ) {
        return row;
      }

      // Skip rest days and non-running activities
      if (
        runType.toLowerCase().includes('rest') ||
        runType.toLowerCase().includes('cross') ||
        runType.toLowerCase().includes('strength') ||
        !runType.trim()
      ) {
        return row;
      }

      // Map run type to pace type
      const paceType = mapRunTypeToPaceType(runType);
      if (paceType && matchedPaceGroup.paces[paceType]) {
        const newPace = matchedPaceGroup.paces[paceType];
        return {
          ...row,
          [paceColumn]: newPace,
        };
      }

      return row;
    });

    // Reconstruct CSV
    const csvLines: string[] = [];
    
    // Add header
    csvLines.push(headers.join(','));

    // Add data rows
    for (const row of updatedRows) {
      const values = headers.map((header) => {
        const value = row[header] || '';
        // Escape commas and quotes in values
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      });
      csvLines.push(values.join(','));
    }

    return csvLines.join('\n');
  } catch (error) {
    console.error('[PACE_GROUP_FILTER] Failed to update CSV with matched pace group:', error);
    // Return original CSV if update fails
    return csvContent;
  }
};
