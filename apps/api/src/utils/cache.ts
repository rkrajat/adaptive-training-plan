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

interface CachedRecommendation {
  content: string;
  cachedAt: number;
  userId: string;
  planId: string;
  weekNumber: number;
}

export const recommendationsCache = new LRUCache<string, CachedRecommendation>({
  max: config.cache.maxEntries,
  ttl: config.cache.recommendationsTtlMs,
});

export const getRecommendationCacheKey = (
  userId: string,
  planId: string,
  weekNumber: number
): string => {
  return `recommendation:${userId}:${planId}:${weekNumber}`;
};

export const invalidateUserRecommendationCache = (
  userId: string,
  planId?: string,
  weekNumber?: number
): boolean => {
  if (planId && weekNumber) {
    // Invalidate specific cache entry
    const key = getRecommendationCacheKey(userId, planId, weekNumber);
    const existed = recommendationsCache.has(key);
    recommendationsCache.delete(key);
    if (existed) {
      log.info("Invalidated recommendation cache", { userId, planId, weekNumber });
    }
    return existed;
  } else {
    // Invalidate all cache entries for this user
    let invalidated = false;
    for (const [key, value] of recommendationsCache.entries()) {
      if (value.userId === userId) {
        recommendationsCache.delete(key);
        invalidated = true;
      }
    }
    if (invalidated) {
      log.info("Invalidated all recommendation cache entries for user", { userId });
    }
    return invalidated;
  }
};
