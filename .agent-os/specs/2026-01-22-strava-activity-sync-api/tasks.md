# Spec Tasks

Tasks for implementing the Strava Activity Sync API as defined in @.agent-os/specs/2026-01-22-strava-activity-sync-api/spec.md

## Tasks

- [x] 1. Create Activity Model and Database Schema
  - [x] 1.1 Create Activity model with Mongoose schema in `apps/api/src/models/Activity.ts`
  - [x] 1.2 Add indexes for query optimization (userId + startDate, userId + stravaActivityId unique)
  - [x] 1.3 Create Activity TypeScript interface in `apps/api/src/types/activity.types.ts`
  - [x] 1.4 Add `lastActivitySyncAt` field to existing User model
  - [x] 1.5 Export Activity model from models index file

- [x] 2. Implement Activity Sync Service
  - [x] 2.1 Create `activity-sync.service.ts` with `syncAllUsers()` method
  - [x] 2.2 Implement per-user sync logic with token refresh using existing `checkAndRefreshToken()`
  - [x] 2.3 Implement bulk upsert for activities using MongoDB `bulkWrite`
  - [x] 2.4 Implement 30-day cleanup (delete activities older than 30 days per user)
  - [x] 2.5 Add comprehensive logging for sync progress and errors

- [x] 3. Create Sync API Endpoint
  - [x] 3.1 Create Zod validation schema for sync response
  - [x] 3.2 Add sync route handler in `apps/api/src/routes/activities.ts`
  - [x] 3.3 Wire up route to activity sync service

- [x] 4. Update Activity Retrieval to Use Database
  - [x] 4.1 Create `activity.service.ts` with `getActivitiesByUserId()` method
  - [x] 4.2 Modify GET `/api/activities` route to query local database instead of Strava API
  - [x] 4.3 Ensure response format matches existing `FormattedActivity[]` structure
