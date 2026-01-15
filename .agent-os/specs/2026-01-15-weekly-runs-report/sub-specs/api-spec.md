# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2026-01-15-weekly-runs-report/spec.md

## Endpoints

### GET /api/activities/weekly-summary

**Purpose:** Retrieve aggregated running statistics for a specific training week

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| startDate | string (ISO 8601) | Yes | The start date of the training plan |
| week | number | Yes | The week number to retrieve (1-indexed) |

**Example Request:**
```
GET /api/activities/weekly-summary?startDate=2026-01-01&week=3
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalDistance": 42500,
    "numberOfRuns": 4,
    "averagePace": 330,
    "totalTime": 14025,
    "longestRun": 15000,
    "weekStartDate": "2026-01-15",
    "weekEndDate": "2026-01-21"
  }
}
```

**Response Fields:**
| Field | Type | Description |
|-------|------|-------------|
| totalDistance | number | Total distance in meters |
| numberOfRuns | number | Count of run activities |
| averagePace | number | Average pace in seconds per kilometer |
| totalTime | number | Total moving time in seconds |
| longestRun | number | Longest single run distance in meters |
| weekStartDate | string | ISO date string for week start |
| weekEndDate | string | ISO date string for week end |

**Empty Week Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "totalDistance": 0,
    "numberOfRuns": 0,
    "averagePace": 0,
    "totalTime": 0,
    "longestRun": 0,
    "weekStartDate": "2026-01-15",
    "weekEndDate": "2026-01-21"
  }
}
```

**Error Responses:**

**400 Bad Request - Missing Parameters:**
```json
{
  "success": false,
  "error": {
    "code": "MISSING_PARAMETERS",
    "message": "startDate and week parameters are required"
  }
}
```

**400 Bad Request - Invalid Week:**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_WEEK",
    "message": "Week number must be a positive integer"
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to fetch activity data"
  }
}
```

## Controller Logic

### WeeklyActivitySummaryController

**Actions:**
1. Validate request parameters (startDate format, week is positive integer)
2. Calculate week date boundaries from startDate and week number
3. Query Strava activities within the date range for the authenticated user
4. Filter to only "Run" type activities
5. Aggregate metrics: sum distances, count runs, calculate average pace, sum times, find max distance
6. Return formatted response

**Business Logic:**
- Week boundaries are calculated as: `weekStart = startDate + (week - 1) * 7 days`
- Week is 7 days inclusive: weekStart to weekStart + 6 days
- Average pace = totalTime / (totalDistance / 1000), returns 0 if no distance
- Only activities with type "Run" are included in calculations

## Validation Schema (Zod)

```typescript
import { z } from 'zod';

export const weeklyActivitySummaryQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format. Use YYYY-MM-DD'),
  week: z.coerce.number().int().positive('Week must be a positive integer'),
});
```
