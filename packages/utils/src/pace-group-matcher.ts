import type { PaceGroup, RaceGoal } from '@adaptive-training-plan/types';

/**
 * Match user's target time to the appropriate pace group
 * 
 * @param raceGoal - User's race goal with target time
 * @param paceGroups - Array of pace groups detected from training plan
 * @returns Matched pace group or null if no match found
 */
export const matchPaceGroupToTargetTime = (
  raceGoal: RaceGoal,
  paceGroups: PaceGroup[]
): PaceGroup | null => {
  if (paceGroups.length === 0) {
    return null;
  }

  const targetTimeSeconds = raceGoal.targetTimeSeconds;

  // Find pace group where target time falls within timeRange
  for (const group of paceGroups) {
    if (!group.timeRange) {
      // Groups without time range (e.g., "Finish Strong") are skipped for matching
      // but can be used as fallback
      continue;
    }

    const { minSeconds, maxSeconds } = group.timeRange;

    // Exact match
    if (minSeconds !== undefined && maxSeconds !== undefined) {
      if (targetTimeSeconds >= minSeconds && targetTimeSeconds <= maxSeconds) {
        return group;
      }
    }
    // Only min specified (e.g., "> 2:00")
    else if (minSeconds !== undefined && maxSeconds === undefined) {
      if (targetTimeSeconds >= minSeconds) {
        return group;
      }
    }
    // Only max specified (e.g., "< 2:00")
    else if (minSeconds === undefined && maxSeconds !== undefined) {
      if (targetTimeSeconds < maxSeconds) {
        return group;
      }
    }
  }

  // If no exact match found, find the closest pace group
  // Calculate distance to each group's time range
  let closestGroup: PaceGroup | null = null;
  let minDistance = Infinity;

  for (const group of paceGroups) {
    if (!group.timeRange) continue;

    const { minSeconds, maxSeconds } = group.timeRange;
    let distance: number;

    if (minSeconds !== undefined && maxSeconds !== undefined) {
      // Distance to range midpoint
      const midpoint = (minSeconds + maxSeconds) / 2;
      distance = Math.abs(targetTimeSeconds - midpoint);
    } else if (minSeconds !== undefined) {
      // Distance to minimum
      distance = Math.abs(targetTimeSeconds - minSeconds);
    } else if (maxSeconds !== undefined) {
      // Distance to maximum
      distance = Math.abs(targetTimeSeconds - maxSeconds);
    } else {
      continue;
    }

    if (distance < minDistance) {
      minDistance = distance;
      closestGroup = group;
    }
  }

  // Return closest group if found, otherwise return first group as fallback
  return closestGroup || paceGroups[0] || null;
};

/**
 * Get the default pace group when user has no race goal
 * Returns the first pace group or null if none exist
 */
export const getDefaultPaceGroup = (
  paceGroups: PaceGroup[]
): PaceGroup | null => {
  if (paceGroups.length === 0) {
    return null;
  }

  // Return first pace group as default
  return paceGroups[0];
};
