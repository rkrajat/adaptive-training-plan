import { LRUCache } from "lru-cache";

import { config } from "../config";
import type { StravaActivity } from "../types/strava.types";

import { log } from "./logger";

interface CachedActivities {
  activities: StravaActivity[];
  cachedAt: number;
  lookbackDays: number;
}

export const activitiesCache = new LRUCache<string, CachedActivities>({
  max: config.cache.maxEntries,
  ttl: config.cache.activitiesTtlMs,
});

export const getActivitiesCacheKey = (userId: string): string => {
  return `strava:activities:${userId}`;
};

export const invalidateUserActivitiesCache = (userId: string): boolean => {
  const key = getActivitiesCacheKey(userId);
  const existed = activitiesCache.has(key);
  activitiesCache.delete(key);
  if (existed) {
    log.info("Invalidated user activities cache", { userId });
  }
  return existed;
};
