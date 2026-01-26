# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2026-01-22-strava-activity-sync-api/spec.md

## Endpoints

### POST /api/activities/sync

**Purpose:** Trigger bulk sync of Strava activities for all users with connected Strava accounts. Fetches last 30 days of activities and stores them locally.

**Authentication:** None (internal endpoint)

**Request Body:** None

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "summary": {
      "totalUsers": 150,
      "usersProcessed": 148,
      "usersFailed": 2,
      "totalActivitiesSynced": 4520,
      "activitiesDeleted": 312
    },
    "failures": [
      {
        "userId": "507f1f77bcf86cd799439011",
        "stravaId": 12345678,
        "error": "Token refresh failed: invalid_grant"
      },
      {
        "userId": "507f1f77bcf86cd799439012",
        "stravaId": 87654321,
        "error": "Strava API error: Rate limit exceeded"
      }
    ],
    "durationMs": 45230
  }
}
```

**Response (500 Internal Server Error):**

```json
{
  "success": false,
  "error": "Sync process failed to start",
  "details": "Database connection error"
}
```

**Behavior:**
- Processes all users sequentially
- Continues processing even if individual users fail
- Returns partial success with failure details
- Always returns 200 if the sync process ran (even with partial failures)
- Returns 500 only if the sync process itself couldn't start

---

### GET /api/activities (Modified)

**Purpose:** Fetch activities for the authenticated user from the local database.

**Authentication:** Required (JWT Bearer token)

**Query Parameters:** None (fetches all stored activities, which represents last 30 days)

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "id": 1234567890,
      "name": "Morning Run",
      "distance": 5000,
      "movingTime": 1800,
      "type": "Run",
      "startDate": "2026-01-20T07:30:00Z",
      "averageHeartrate": 145
    }
  ]
}
```

**Response (404 Not Found) - if no synced activities:**

```json
{
  "success": true,
  "data": [],
  "message": "No activities found. Activities may not have been synced yet."
}
```

**Changes from current implementation:**
- Previously: Called Strava API directly via `stravaService.fetchActivities()`
- Now: Queries local `Activity` collection filtered by `userId`
- Response format remains identical for frontend compatibility

---

### GET /api/activities/weekly-summary (No Changes)

**Purpose:** Get aggregated weekly statistics for the authenticated user.

**Note:** This endpoint continues to work as before. It should be updated to read from local database in a future iteration, but for this spec it will continue using the activities data (now sourced from database via the modified GET /api/activities logic internally).

---

## Error Codes

| Status | Code | Description |
|--------|------|-------------|
| 200 | - | Success (including partial sync success) |
| 401 | UNAUTHORIZED | Missing or invalid JWT token (for protected endpoints) |
| 500 | INTERNAL_ERROR | Sync process failed to initialize |

## Rate Limiting Considerations

The sync endpoint processes users sequentially with no artificial delays. Strava's rate limits are:
- 600 requests per 15 minutes
- 30,000 requests per day

For a platform with N users, each sync cycle makes approximately N API calls. If rate limits are hit, the affected user is skipped and included in the failures array. Consider adding delays between users if rate limit errors become common.
