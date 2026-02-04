import type { PaceGroup } from "@adaptive-training-plan/types";

/**
 * Match a target time to the appropriate pace group
 * @param paceGroups - Array of pace groups to match against
 * @param targetTimeSeconds - Target time in seconds
 * @returns Matched pace group or null if no match found
 */
export function matchPaceGroupToTargetTime(
  paceGroups: PaceGroup[],
  targetTimeSeconds: number
): PaceGroup | null {
  if (paceGroups.length === 0) {
    return null;
  }

  // First, find all groups where targetTimeSeconds falls within the range
  // For "Sub X" groups (minSeconds === 0): targetTimeSeconds < maxSeconds (exclusive upper bound)
  // For ranges: targetTimeSeconds >= minSeconds && targetTimeSeconds <= maxSeconds (inclusive both bounds)
  // For open-ended groups (maxSeconds === null): match if targetTimeSeconds >= minSeconds (no upper limit)
  
  const matchingGroups: Array<{ group: PaceGroup; priority: number }> = [];

  for (const group of paceGroups) {
    const { minSeconds, maxSeconds } = group.timeRange;

    // Handle open-ended groups (e.g., "Completion Goal")
    if (maxSeconds === null) {
      // Open-ended group: match if targetTimeSeconds >= minSeconds (no upper limit)
      if (targetTimeSeconds >= minSeconds) {
        matchingGroups.push({ group, priority: 3 }); // Lower priority than specific ranges
      }
      continue;
    }

    // Check if this is a "Sub X" group (minSeconds is 0)
    const isSubGroup = minSeconds === 0;
    
    if (isSubGroup) {
      // For "Sub X" groups, match if targetTimeSeconds < maxSeconds (exclusive)
      if (targetTimeSeconds < maxSeconds) {
        matchingGroups.push({ group, priority: 2 }); // Lower priority than ranges
      }
    } else {
      // For ranges, match if targetTimeSeconds is within [minSeconds, maxSeconds] (inclusive)
      if (targetTimeSeconds >= minSeconds && targetTimeSeconds <= maxSeconds) {
        // Priority: prefer groups where target is at the lower boundary (minSeconds)
        // This ensures 2:00:00 matches "2:00-2:20" not "Sub 2:00"
        const priority = targetTimeSeconds === minSeconds ? 1 : 2;
        matchingGroups.push({ group, priority });
      }
    }
  }

  // If we found matching groups, return the one with highest priority (lowest priority number)
  if (matchingGroups.length > 0) {
    matchingGroups.sort((a, b) => a.priority - b.priority);
    return matchingGroups[0].group;
  }

  // If no exact match, find the closest group
  let bestMatch: PaceGroup | null = null;
  let smallestGap = Infinity;

  for (const group of paceGroups) {
    const { minSeconds, maxSeconds } = group.timeRange;

    // Calculate gap to this group
    let gap: number;
    if (targetTimeSeconds < minSeconds) {
      gap = minSeconds - targetTimeSeconds;
    } else if (maxSeconds !== null && targetTimeSeconds > maxSeconds) {
      gap = targetTimeSeconds - maxSeconds;
    } else {
      continue; // Should have matched above
    }

    if (gap < smallestGap) {
      smallestGap = gap;
      bestMatch = group;
    }
  }

  // If we found a close match (within 5 minutes), return it
  if (bestMatch && smallestGap <= 300) {
    return bestMatch;
  }

  return null;
}

/**
 * Get the default pace group (first group) if no match is found
 * @param paceGroups - Array of pace groups
 * @returns First pace group or null if array is empty
 */
export function getDefaultPaceGroup(
  paceGroups: PaceGroup[]
): PaceGroup | null {
  if (paceGroups.length === 0) {
    return null;
  }
  return paceGroups[0];
}

/**
 * Get the most relaxed/easiest pace group (for open-ended goals like "Completion")
 * This is typically the group with the slowest/easiest paces or the open-ended group
 * @param paceGroups - Array of pace groups
 * @returns Most relaxed pace group or null if array is empty
 */
export function getMostRelaxedPaceGroup(
  paceGroups: PaceGroup[]
): PaceGroup | null {
  if (paceGroups.length === 0) {
    return null;
  }

  // First, try to find an open-ended group (maxSeconds === null)
  const openEndedGroup = paceGroups.find(
    (group) => group.timeRange.maxSeconds === null
  );
  if (openEndedGroup) {
    return openEndedGroup;
  }

  // If no open-ended group, find the group with the highest maxSeconds
  // (which typically corresponds to the slowest/easiest paces)
  let mostRelaxed: PaceGroup | null = null;
  let highestMaxSeconds = -1;

  for (const group of paceGroups) {
    const { maxSeconds } = group.timeRange;
    if (maxSeconds !== null && maxSeconds > highestMaxSeconds) {
      highestMaxSeconds = maxSeconds;
      mostRelaxed = group;
    }
  }

  // If we found a group with a maxSeconds, return it
  if (mostRelaxed) {
    return mostRelaxed;
  }

  // Fallback to first group
  return paceGroups[0];
}
