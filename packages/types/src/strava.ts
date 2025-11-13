import type { ExperienceLevel } from './user.types';

export interface Activity {
  id: number;
  name: string;
  distance: number;
  movingTime: number;
  type: string;
  startDate: string;
  averageHeartrate: number | null;
}

export interface User {
  id: string;
  stravaId: number;
  firstName: string;
  lastName: string;
  profilePhoto: string;
  experienceLevel?: ExperienceLevel;
}
