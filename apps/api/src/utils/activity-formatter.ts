import type {
  StravaActivity,
  EnhancedFormattedActivity,
} from '../types/strava.types';

/**
 * Derive run type from activity name using keyword matching
 */
const deriveRunType = (activityName: string): string | undefined => {
  const nameLower = activityName.toLowerCase();

  if (nameLower.includes('rest') || nameLower.includes('off')) {
    return 'Rest';
  }
  if (nameLower.includes('long')) {
    return 'Long';
  }
  if (
    nameLower.includes('tempo') ||
    nameLower.includes('threshold') ||
    nameLower.includes('lactate')
  ) {
    return 'Tempo';
  }
  if (
    nameLower.includes('interval') ||
    nameLower.includes('speed') ||
    nameLower.includes('track') ||
    nameLower.includes('rep')
  ) {
    return 'Interval';
  }
  if (
    nameLower.includes('easy') ||
    nameLower.includes('recovery') ||
    nameLower.includes('base')
  ) {
    return 'Easy';
  }

  // Default to undefined if no pattern matches
  return undefined;
};

/**
 * Calculate average pace in min/km format from distance and time
 */
const calculatePace = (distanceMeters: number, movingTimeSeconds: number): string => {
  if (distanceMeters === 0 || movingTimeSeconds === 0) {
    return '0:00';
  }

  const distanceKm = distanceMeters / 1000;
  const timeMinutes = movingTimeSeconds / 60;
  const paceMinPerKm = timeMinutes / distanceKm;

  const minutes = Math.floor(paceMinPerKm);
  const seconds = Math.round((paceMinPerKm - minutes) * 60);

  return `${minutes}:${String(seconds).padStart(2, '0')}`;
};

/**
 * Get day of week abbreviation from date string
 */
const getDayOfWeek = (dateString: string): string => {
  const date = new Date(dateString);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
};

/**
 * Format date to YYYY-MM-DD
 */
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().split('T')[0];
};

/**
 * Format Strava activities for AI recommendations with enhanced metadata
 * Converts raw Strava activities into a structured format with calculated fields
 */
export const formatActivitiesForAI = (
  activities: StravaActivity[]
): EnhancedFormattedActivity[] => {
  return activities
    .filter((activity) => activity.type === 'Run')
    .map((activity) => {
      const enhancedActivity: EnhancedFormattedActivity = {
        date: formatDate(activity.start_date),
        day: getDayOfWeek(activity.start_date),
        actual_distance_km: Number((activity.distance / 1000).toFixed(2)),
        avg_pace_min_per_km: calculatePace(
          activity.distance,
          activity.moving_time
        ),
        avg_hr_bpm: activity.average_heartrate
          ? Math.round(activity.average_heartrate)
          : null,
      };

      // Add optional fields only if they exist
      const runType = deriveRunType(activity.name);
      if (runType) {
        enhancedActivity.actual_run_type = runType;
      }

      if (activity.max_heartrate) {
        enhancedActivity.max_hr_bpm = Math.round(activity.max_heartrate);
      }

      // Note: sleep_score, recovery_pct, and notes are left undefined
      // These will be populated in future enhancements from other data sources

      return enhancedActivity;
    });
};
