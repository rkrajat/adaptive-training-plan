/**
 * Mock data for development and testing
 * Used when USE_MOCK_DATA=true in .env
 */

interface MockActivity {
  id: number;
  name: string;
  distance: number;
  movingTime: number;
  type: string;
  startDate: string;
  averageHeartrate: number | null;
}

export const mockActivities: MockActivity[] = [
  {
    id: 16299797692,
    name: "Morning Ride",
    distance: 0,
    movingTime: 3012,
    type: "Ride",
    startDate: "2025-10-30T07:42:50Z",
    averageHeartrate: 134.3,
  },
  {
    id: 16258824143,
    name: "Morning Run",
    distance: 8164.7,
    movingTime: 2644,
    type: "Run",
    startDate: "2025-10-26T08:18:45Z",
    averageHeartrate: 154.7,
  },
  {
    id: 16234033534,
    name: "Evening Ride",
    distance: 0,
    movingTime: 3625,
    type: "Ride",
    startDate: "2025-10-23T16:03:48Z",
    averageHeartrate: 132,
  },
  {
    id: 16190433633,
    name: "Morning Run",
    distance: 4678.8,
    movingTime: 2029,
    type: "Run",
    startDate: "2025-10-19T08:55:39Z",
    averageHeartrate: 140.8,
  },
  {
    id: 16167338959,
    name: "Morning Run",
    distance: 5040.9,
    movingTime: 1724,
    type: "Run",
    startDate: "2025-10-17T06:24:52Z",
    averageHeartrate: 134.8,
  },
];

export const mockData = {
  activities: mockActivities,
};
