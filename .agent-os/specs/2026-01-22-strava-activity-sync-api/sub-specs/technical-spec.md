# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2026-01-22-strava-activity-sync-api/spec.md

## Technical Requirements

### Sync API Endpoint

- **Endpoint**: `POST /api/activities/sync`
- **Authentication**: None required (internal/admin endpoint) - consider adding API key protection in production
- **Request Body**: None required
- **Response**: JSON with sync summary

```typescript
interface SyncResponse {
  success: boolean;
  summary: {
    totalUsers: number;
    usersProcessed: number;
    usersFailed: number;
    totalActivitiesSynced: number;
    activitiesDeleted: number; // Old activities removed (>30 days)
  };
  failures: Array<{
    userId: string;
    stravaId: number;
    error: string;
  }>;
  durationMs: number;
}
```

### Sync Processing Logic

1. **Fetch all users** with non-null `stravaRefreshToken` (users with Strava connected)
2. **For each user** (sequential to respect Strava rate limits):
   - Check and refresh token if expired (reuse existing `checkAndRefreshToken()`)
   - Fetch activities from Strava (last 30 days)
   - Upsert activities into `Activity` collection (match by `stravaActivityId`)
   - Delete activities older than 30 days for this user
   - Update user's `lastActivitySyncAt` timestamp
3. **Error handling per user**:
   - If token refresh fails: Mark user sync as failed, continue to next user
   - If activity fetch fails: Log error, continue to next user
   - Collect all failures for response summary
4. **Return summary** with counts and failure details

### Activity Retrieval Update

- Modify `GET /api/activities` to query the local `Activity` collection
- Filter by authenticated user's ID
- Sort by `startDate` descending
- Remove direct Strava API calls from this route
- Keep the same response format (`FormattedActivity[]`)

### Performance Considerations

- Process users sequentially to avoid Strava API rate limits (600 requests/15min, 30,000/day)
- Use bulk write operations for activity upserts (`bulkWrite` with `upsertOne`)
- Index `Activity` collection on `{ userId: 1, startDate: -1 }` for efficient queries
- Index `Activity` collection on `{ stravaActivityId: 1 }` for upsert matching
- Add compound index `{ userId: 1, stravaActivityId: 1 }` for unique constraint

### Logging Requirements

- Log sync start with total user count
- Log per-user progress: `Syncing user X of Y (stravaId: Z)`
- Log per-user completion: activities synced, deleted
- Log failures with error details
- Log sync completion with summary stats

### Error Handling Strategy

- **Token Refresh Failure**: Skip user, add to failures array, continue
- **Strava API Error (rate limit)**: Log warning, skip user, continue
- **Strava API Error (other)**: Log error, skip user, continue
- **Database Error**: Log error, skip user, continue
- **Endpoint should never throw** - always return a response with partial results if needed
