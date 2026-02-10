# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2026-01-21-recommendation-acceptance/spec.md

## Endpoints

### GET /api/recommendations/active

**Purpose:** Retrieve the user's currently active accepted recommendation, if one exists and is not expired.

**Authentication:** JWT required

**Parameters:** None

**Response (200 - Has Active):**
```json
{
  "hasActive": true,
  "recommendation": {
    "id": "64abc123def456...",
    "content": "## Week 5 Training Recommendations\n\n...",
    "weekNumber": 5,
    "acceptedAt": "2026-01-21T14:30:00.000Z",
    "expiresAt": "2026-01-26T23:59:59.999Z",
    "trainingPlan": {
      "id": "64xyz789...",
      "name": "Marathon Training Plan"
    },
    "isStale": false
  }
}
```

**Response (200 - No Active):**
```json
{
  "hasActive": false,
  "recommendation": null
}
```

**Errors:**
- 401: User not authenticated

---

### POST /api/recommendations/:id/accept

**Purpose:** Accept a recommendation, marking it as the user's active recommendation until expiry. Any previously accepted recommendation for this user is automatically rejected. If recommendation doesn't exist in database, checks cache and creates DB record first.

**Authentication:** JWT required

**Parameters:**
- `id` (path): Recommendation ID (MongoDB ObjectId) - can be a placeholder if accepting from cache

**Request Body:** None

**Note:** If recommendation doesn't exist in DB, the endpoint will:
1. Look up cached recommendation for the user
2. Create DB record with cached content
3. Then proceed with normal accept flow
4. Invalidate cache after accepting

**Response (200):**
```json
{
  "id": "64abc123def456...",
  "status": "accepted",
  "acceptedAt": "2026-01-21T14:30:00.000Z",
  "expiresAt": "2026-01-26T23:59:59.999Z",
  "message": "Recommendation accepted successfully"
}
```

**Errors:**
- 400: Invalid recommendation ID format
- 400: Cannot accept recommendation with status: [status]
- 401: User not authenticated
- 403: This recommendation does not belong to you
- 404: Recommendation not found

---

### POST /api/recommendations/:id/reject

**Purpose:** Reject a recommendation with a specified follow-up action. If action is "generate_new", invalidates the recommendation cache to allow fresh generation.

**Authentication:** JWT required

**Parameters:**
- `id` (path): Recommendation ID (MongoDB ObjectId)

**Request Body:**
```json
{
  "action": "generate_new" | "discard"
}
```

**Cache Invalidation:** When `action` is "generate_new", the endpoint invalidates the recommendation cache for the user/plan/week combination, allowing a fresh recommendation to be generated on next request.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| action | string | Yes | Either "generate_new" (user wants new recommendation) or "discard" (user wants empty state) |

**Response (200):**
```json
{
  "id": "64abc123def456...",
  "status": "rejected",
  "rejectedAt": "2026-01-21T14:35:00.000Z",
  "action": "generate_new",
  "message": "Recommendation rejected successfully"
}
```

**Errors:**
- 400: Invalid recommendation ID format
- 400: Invalid action value (must be "generate_new" or "discard")
- 401: User not authenticated
- 403: This recommendation does not belong to you
- 404: Recommendation not found

## Validation Schemas

### Reject Recommendation Request

```typescript
import { z } from 'zod';

export const rejectRecommendationSchema = z.object({
  action: z.enum(['generate_new', 'discard']),
});
```

## Controller Logic

### Accept Flow

1. Validate JWT authentication
2. Validate recommendation ID format (valid ObjectId)
3. Fetch recommendation from database
4. Verify recommendation exists (404 if not)
5. Verify recommendation belongs to authenticated user (403 if not)
6. Verify recommendation status is 'pending' (400 if not)
7. Reject any existing accepted recommendations for this user
8. Calculate expiry date (Sunday of target week)
9. Update recommendation: status='accepted', acceptedAt=now, expiresAt=calculated
10. Return success response with acceptance details

### Reject Flow

1. Validate JWT authentication
2. Validate recommendation ID format
3. Validate request body (action enum)
4. Fetch recommendation from database
5. Verify recommendation exists
6. Verify recommendation belongs to authenticated user
7. Update recommendation: status='rejected', rejectedAt=now
8. **If action is "generate_new"**: Invalidate recommendation cache for user/plan/week
9. Return success response with action echoed back

### Get Active Flow

1. Validate JWT authentication
2. Query for recommendation where userId matches AND status='accepted' AND expiresAt > now
3. If found, return with hasActive=true and full recommendation data
4. If not found, return with hasActive=false and null recommendation
