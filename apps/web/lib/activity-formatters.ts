/**
 * Utility functions for formatting activity-related data
 */

/**
 * Format duration from seconds to mm:ss format
 * @param seconds - Duration in seconds
 * @returns Formatted string in mm:ss format
 */
export const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) {
    return "0:00";
  }
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

/**
 * Format date string to human-readable format
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "Jan 15, 2025")
 */
export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
