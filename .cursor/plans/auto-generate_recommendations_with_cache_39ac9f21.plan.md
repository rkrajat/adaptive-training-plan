---
name: Auto-generate recommendations with cache
overview: Update recommendation flow to auto-generate recommendations server-side on dashboard load, store them in in-memory cache (not DB), and only save to DB when user accepts. Manual "Generate" button will fetch from cache instead of generating.
todos:
  - id: 1
    content: Create recommendation cache infrastructure in apps/api/src/utils/cache.ts (add recommendationsCache, getRecommendationCacheKey, invalidateUserRecommendationCache)
    status: pending
  - id: 2
    content: Add recommendationsTtlMs to cache config in apps/api/src/config/index.ts
    status: pending
  - id: 3
    content: Create recommendation-generation.service.ts with generateAndCacheRecommendation() and getCachedRecommendation() methods
    status: pending
  - id: 4
    content: Add GET /api/recommendations/pending endpoint in apps/api/src/routes/recommendations.ts
    status: pending
  - id: 5
    content: Modify POST /api/recommendations/:id/accept to check cache and save cached recommendation to DB before accepting
    status: pending
  - id: 6
    content: Modify reject flow to invalidate cache when action is "generate_new" in apps/api/src/routes/recommendations.ts
    status: pending
  - id: 7
    content: Update POST /api/recommendations/generate-with-plan to check cache first and remove DB save logic
    status: pending
  - id: 8
    content: Add recommendationsApi.getPending() method in apps/web/lib/api.ts
    status: pending
  - id: 9
    content: Add fetchPendingRecommendation() method and update generateRecommendations() in apps/web/hooks/use-recommendations.ts
    status: pending
  - id: 10
    content: Add useEffect in apps/web/app/dashboard/page.tsx to auto-fetch pending recommendation on dashboard load
    status: pending
---

# Auto-Generate Recommendations with In-Memory Cache

## Overview

Transform the recommendation flow from user-triggered generation to automatic server-side generation on dashboard load. Recommendations will be cached in memory (similar to activities cache) and only saved to database when user accepts them.

## Current Flow

1. User clicks "Generate Recommendation" button
2. Frontend calls `POST /api/recommendations/generate-with-plan`
3. Backend generates recommendation (streaming)
4. Backend saves to DB immediately with `status: "pending"`
5. Frontend displays recommendation

## New Flow

1. User loads dashboard (with active plan)
2. Backend automatically checks cache → generates if needed → caches result
3. Frontend fetches cached recommendation (no streaming needed)
4. User accepts → recommendation saved to DB with `status: "accepted"`
5. Manual "Generate" button fetches from cache (or generates if cache miss)

## Implementation Plan

### 1. Create Recommendation Cache Infrastructure

**File**: `apps/api/src/utils/cache.ts`

- Add `recommendationsCache` using `LRUCache` (similar to `activitiesCache`)
- Add `getRecommendationCacheKey(userId: string, planId: string, weekNumber: number): string`
- Add `invalidateUserRecommendationCache(userId: string, planId?: string, weekNumber?: number): boolean`
- Configure TTL in `apps/api/src/config/index.ts` (add `recommendationsTtlMs` to cache config)

### 2. Create Recommendation Generation Service

**File**: `apps/api/src/services/recommendation-generation.service.ts` (new)

- `generateAndCacheRecommendation()` method that:
- Checks cache first (by userId, planId, weekNumber)
- If cache hit, returns cached recommendation
- If cache miss:
- Fetches training plan, activities, user data
- Calls `aiService.generateRecommendationsWithEnhancedPlan()`
- Accumulates streamed content
- Stores in cache (NOT in DB)
- Returns recommendation content
- `getCachedRecommendation()` method to retrieve from cache
- Handle errors gracefully (log but don't throw)

### 3. Create Auto-Generation Endpoint

**File**: `apps/api/src/routes/recommendations.ts`

- Add `GET /api/recommendations/pending` endpoint:
- Authenticated route
- Takes `planId` as query param (or uses active plan)
- Calls `recommendationGenerationService.generateAndCacheRecommendation()`
- Returns JSON with `{ content: string, cached: boolean }` (not streaming)
- Ignores any pending recommendations in DB for current week

### 4. Modify Accept Flow to Save Cached Recommendation

**File**: `apps/api/src/routes/recommendations.ts`

- Modify `POST /api/recommendations/:id/accept` endpoint:
- Before calling `acceptRecommendation()`, check if recommendation exists in cache
- If found in cache, create DB record with cached content first, then accept it
- If from DB, proceed as normal
- After saving to DB, invalidate cache entry

### 4b. Modify Reject Flow to Invalidate Cache

**File**: `apps/api/src/services/recommendation-acceptance.service.ts` or `apps/api/src/routes/recommendations.ts`

- Modify reject flow to handle cache invalidation:
- When user rejects with "generate_new" action:
- Invalidate recommendation cache for user/plan/week
- Return success (frontend will trigger new generation)
- When user rejects with "discard" action:
- Just mark as rejected (no cache invalidation needed)

### 5. Update Manual Generate Endpoint

**File**: `apps/api/src/routes/recommendations.ts`

- Modify `POST /api/recommendations/generate-with-plan`:
- First check cache
- If cache hit, return cached recommendation (stream it for UX consistency)
- If cache miss, generate and cache (but don't save to DB)
- Remove DB save logic (lines 241-268)

### 6. Update Frontend to Auto-Fetch on Dashboard Load

**File**: `apps/web/hooks/use-recommendations.ts`

- Add `fetchPendingRecommendation(planId: string)` method
- Calls `GET /api/recommendations/pending?planId=...`
- Updates state with cached recommendation
- Modify `generateRecommendations()` to call the new endpoint (which fetches from cache)

**File**: `apps/web/app/dashboard/page.tsx`

- Add `useEffect` that calls `fetchPendingRecommendation()` when:
- `activePlan` is loaded
- User doesn't have an active (accepted) recommendation
- No recommendation is currently displayed

### 7. Update Frontend API Client

**File**: `apps/web/lib/api.ts`

- Add `recommendationsApi.getPending(planId: string)` method
- Returns `{ content: string, cached: boolean }`

### 8. Handle Cache Key Structure

- Format: `recommendation:${userId}:${planId}:${weekNumber}`
- This ensures one recommendation per user/plan/week combination
- When week changes, new cache entry is created automatically

### 9. Cache Invalidation Strategy

- Invalidate when:
- User accepts recommendation (save to DB, clear cache)
- User rejects with "generate_new" action (invalidate cache, then generate fresh)
- TTL: Simple fixed duration (e.g., 1 hour, 6 hours, or configurable)
- No dependency on activities cache
- No activity detection - keeps it simple
- Cache expires based on time only

## Key Design Decisions

1. **Cache vs DB**: Recommendations live in cache until accepted, then moved to DB
2. **Pending DB Recommendations**: Ignored - always generate fresh and cache
3. **Streaming**: Manual generate still streams for UX, but auto-fetch returns JSON
4. **Cache Key**: `userId:planId:weekNumber` ensures one recommendation per week
5. **Error Handling**: If generation fails, return error but don't break dashboard load
6. **TTL Strategy**: Simple fixed TTL (no activity detection, no cache dependencies)
7. **Reject with "generate_new"**: Invalidates cache and generates fresh recommendation

## Files to Modify

1. `apps/api/src/utils/cache.ts` - Add recommendation cache
2. `apps/api/src/config/index.ts` - Add cache TTL config
3. `apps/api/src/services/recommendation-generation.service.ts` - New service
4. `apps/api/src/routes/recommendations.ts` - Add pending endpoint, modify generate endpoint
5. `apps/api/src/services/recommendation-acceptance.service.ts` - Handle cache-to-DB save
6. `apps/web/lib/api.ts` - Add getPending method
7. `apps/web/hooks/use-recommendations.ts` - Add fetchPendingRecommendation
8. `apps/web/app/dashboard/page.tsx` - Auto-fetch on load

## Testing Considerations

- Test cache hit/miss scenarios
- Test concurrent requests (same user/plan/week)
- Test cache invalidation on accept
- Test cache invalidation on reject with "generate_new"
- Test behavior when generation fails
- Test with existing pending DB recommendations (should be ignored)
- Test TTL expiration (cache should expire after configured time)