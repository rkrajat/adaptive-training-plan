import { mockData } from "../mock-data";

/**
 * Check if mock data should be used instead of real APIs
 * Controlled by USE_MOCK_DATA environment variable
 */
export const useMockData = (): boolean => {
  return process.env.USE_MOCK_DATA === "true";
};

/**
 * Get mock Strava activities
 * Returns activities in the format expected by the application
 */
export const getMockActivities = (): any[] => {
  return mockData.activities;
};
