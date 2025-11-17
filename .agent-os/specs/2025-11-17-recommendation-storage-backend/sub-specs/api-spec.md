# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-11-17-recommendation-storage-backend/spec.md

## Important: Two Types of Feedback

This API specification involves two distinct types of feedback:

1. **Athlete Input Feedback (userFeedback parameter)**:
   - Free-text provided by users WHEN REQUESTING a recommendation
   - Passed as `userFeedback` in request body to `/api/recommendations/generate-with-plan`
   - Example: "I felt the long run was too difficult, please reduce intensity"
   - Used as INPUT to AI generation to create better recommendations
   - Stored in Recommendation model as `athleteInputFeedback` field

2. **Recommendation Evaluation Feedback**:
   - Structured feedback (rating, wouldFollow, comment) provided AFTER receiving a recommendation
   - Submitted via existing POST `/api/feedback` endpoint
   - Stored in separate Feedback model
   - Links to stored recommendation via `recommendationId`

## Modified Endpoints

### POST /api/recommendations/generate-with-plan

**Purpose**: Generate AI training recommendation with training plan context AND store the recommendation in database

**Changes from Current Implementation**:
- Accumulate streamed content in memory during generation
- After streaming completes, save recommendation to MongoDB
- Add `X-Recommendation-Id` header to response with the stored recommendation's MongoDB ObjectId
- Add `X-Storage-Error` header if storage fails (optional, for debugging)

#### Request

**Method**: `POST`

**Authentication**: Required (JWT)

**Headers**:
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Body**:
```json
{
  "planId": "507f1f77bcf86cd799439011",
  "userFeedback": "I felt the long run was too difficult, please reduce intensity" // optional athlete input
}
```

**Note**: The `userFeedback` parameter is athlete input feedback provided when requesting the recommendation. This is different from the evaluation feedback submitted after receiving the recommendation.

**Validation Schema**:
```typescript
{
  planId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid plan ID format"),
  userFeedback: z.string().max(1000).optional() // Matches athleteInputFeedback max length
}
```

#### Response

**Status Code**: `200 OK` (streaming)

**Headers**:
```
Content-Type: text/plain; charset=utf-8
Cache-Control: no-cache
Connection: keep-alive
X-Recommendation-Id: 507f191e810c19729de860ea  // NEW: MongoDB ObjectId of stored recommendation
X-Storage-Error: true  // OPTIONAL: Only present if storage failed
```

**Body**: Streaming text (markdown recommendation content)

```
# Weekly Training Recommendation

Based on your recent activities...

## Key Insights
...
```

#### Error Responses

**400 Bad Request** - Invalid request body
```json
{
  "error": "Invalid plan ID format"
}
```

**401 Unauthorized** - Missing or invalid JWT
```json
{
  "error": "User not authenticated"
}
```

**403 Forbidden** - Training plan doesn't belong to user
```json
{
  "error": "Training plan not found or access denied"
}
```

**500 Internal Server Error** - AI generation failed
```json
{
  "error": "Internal server error"
}
```

#### Implementation Details

**Controller Location**: `apps/api/src/routes/recommendations.ts` (modify existing handler)

**Implementation Steps**:
1. Validate request body (existing)
2. Fetch training plan and Strava data (existing)
3. Generate AI recommendation via streaming (existing)
4. **NEW**: Accumulate chunks in memory variable during streaming
5. **NEW**: After streaming completes, create Recommendation document:
   ```typescript
   const recommendation = new Recommendation({
     userId: req.user.userId,
     trainingPlanId: planId,
     weekNumber: trainingPlan.currentWeek,
     content: accumulatedContent,
     athleteInputFeedback: userFeedback || null, // Store athlete's input text if provided
     isRegenerated: !!userFeedback,
     previousRecommendationId: null, // Future enhancement
   });
   await recommendation.save();
   ```
6. **NEW**: Set response header: `res.setHeader('X-Recommendation-Id', recommendation._id.toString())`
7. **NEW**: Handle storage errors gracefully:
   ```typescript
   try {
     await recommendation.save();
     res.setHeader('X-Recommendation-Id', recommendation._id.toString());
   } catch (error) {
     log.error('Failed to store recommendation', error);
     res.setHeader('X-Storage-Error', 'true');
   }
   ```

---

## New Endpoints

### GET /api/recommendations/:id

**Purpose**: Retrieve a single recommendation by its MongoDB ObjectId

#### Request

**Method**: `GET`

**Authentication**: Required (JWT)

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**URL Parameters**:
- `id` (required): MongoDB ObjectId of the recommendation

**Example**: `/api/recommendations/507f191e810c19729de860ea`

#### Response

**Status Code**: `200 OK`

**Body**:
```json
{
  "id": "507f191e810c19729de860ea",
  "userId": "507f1f77bcf86cd799439011",
  "trainingPlan": {
    "id": "507f1f77bcf86cd799439012",
    "name": "Marathon Training Plan",
    "currentWeek": 8
  },
  "weekNumber": 8,
  "content": "# Weekly Training Recommendation\n\nBased on your recent...",
  "athleteInputFeedback": "I felt the long run was too difficult, please reduce intensity",
  "isRegenerated": false,
  "previousRecommendationId": null,
  "createdAt": "2025-11-17T10:30:00.000Z",
  "updatedAt": "2025-11-17T10:30:00.000Z"
}
```

#### Error Responses

**400 Bad Request** - Invalid recommendation ID format
```json
{
  "error": "Invalid recommendation ID format"
}
```

**401 Unauthorized** - Missing or invalid JWT
```json
{
  "error": "User not authenticated"
}
```

**403 Forbidden** - Recommendation doesn't belong to user
```json
{
  "error": "Access denied: This recommendation does not belong to you"
}
```

**404 Not Found** - Recommendation doesn't exist
```json
{
  "error": "Recommendation not found"
}
```

#### Implementation Details

**File**: `apps/api/src/controllers/recommendation.controller.ts` (new file)

**Implementation**:
```typescript
export const getRecommendationById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { id } = req.params;

    if (!userId) {
      sendUnauthorized(res, 'User not authenticated');
      return;
    }

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      sendBadRequest(res, 'Invalid recommendation ID format');
      return;
    }

    // Find recommendation with trainingPlan population
    const recommendation = await Recommendation.findById(id)
      .populate('trainingPlanId', 'name currentWeek');

    if (!recommendation) {
      sendNotFound(res, 'Recommendation not found');
      return;
    }

    // Verify ownership
    if (recommendation.userId.toString() !== userId) {
      sendForbidden(res, 'Access denied: This recommendation does not belong to you');
      return;
    }

    sendSuccess(res, {
      id: recommendation._id,
      userId: recommendation.userId,
      trainingPlan: {
        id: recommendation.trainingPlanId._id,
        name: recommendation.trainingPlanId.name,
        currentWeek: recommendation.trainingPlanId.currentWeek,
      },
      weekNumber: recommendation.weekNumber,
      content: recommendation.content,
      athleteInputFeedback: recommendation.athleteInputFeedback,
      isRegenerated: recommendation.isRegenerated,
      previousRecommendationId: recommendation.previousRecommendationId,
      createdAt: recommendation.createdAt,
      updatedAt: recommendation.updatedAt,
    });
  } catch (error) {
    log.error('Error fetching recommendation', error);
    sendInternalError(res, 'Failed to fetch recommendation');
  }
};
```

---

### GET /api/recommendations/user/history

**Purpose**: Retrieve user's recommendation history with optional filtering

#### Request

**Method**: `GET`

**Authentication**: Required (JWT)

**Headers**:
```
Authorization: Bearer <jwt_token>
```

**Query Parameters**:
- `trainingPlanId` (optional): Filter by specific training plan (MongoDB ObjectId)
- `weekNumber` (optional): Filter by specific week number (integer)
- `limit` (optional): Number of results (integer, default: 20, max: 100)
- `offset` (optional): Pagination offset (integer, default: 0)

**Examples**:
- `/api/recommendations/user/history` - Get 20 most recent recommendations
- `/api/recommendations/user/history?trainingPlanId=507f1f77bcf86cd799439012` - Filter by plan
- `/api/recommendations/user/history?trainingPlanId=507f1f77bcf86cd799439012&weekNumber=8` - Filter by plan and week
- `/api/recommendations/user/history?limit=50&offset=20` - Pagination

#### Response

**Status Code**: `200 OK`

**Body**:
```json
{
  "recommendations": [
    {
      "id": "507f191e810c19729de860ea",
      "trainingPlan": {
        "id": "507f1f77bcf86cd799439012",
        "name": "Marathon Training Plan"
      },
      "weekNumber": 8,
      "contentPreview": "# Weekly Training Recommendation\n\nBased on your recent...",
      "isRegenerated": false,
      "createdAt": "2025-11-17T10:30:00.000Z"
    },
    {
      "id": "507f191e810c19729de860eb",
      "trainingPlan": {
        "id": "507f1f77bcf86cd799439012",
        "name": "Marathon Training Plan"
      },
      "weekNumber": 7,
      "contentPreview": "# Weekly Training Recommendation\n\nGreat progress...",
      "isRegenerated": false,
      "createdAt": "2025-11-10T09:15:00.000Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 20,
    "offset": 0,
    "hasMore": false
  }
}
```

**Note**: `contentPreview` is truncated to first 200 characters for performance. Use GET /api/recommendations/:id to fetch full content.

#### Error Responses

**400 Bad Request** - Invalid query parameters
```json
{
  "error": "Invalid trainingPlanId format",
  "details": {
    "trainingPlanId": "Must be a valid MongoDB ObjectId"
  }
}
```

**401 Unauthorized** - Missing or invalid JWT
```json
{
  "error": "User not authenticated"
}
```

#### Implementation Details

**File**: `apps/api/src/controllers/recommendation.controller.ts`

**Implementation**:
```typescript
export const getUserRecommendationHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      sendUnauthorized(res, 'User not authenticated');
      return;
    }

    // Parse and validate query parameters
    const {
      trainingPlanId,
      weekNumber,
      limit = 20,
      offset = 0,
    } = req.query;

    const queryLimit = Math.min(Number(limit), 100);
    const queryOffset = Number(offset);

    // Build query filter
    const filter: any = { userId };

    if (trainingPlanId) {
      if (!mongoose.Types.ObjectId.isValid(trainingPlanId as string)) {
        sendBadRequest(res, 'Invalid trainingPlanId format');
        return;
      }
      filter.trainingPlanId = trainingPlanId;
    }

    if (weekNumber) {
      const weekNum = Number(weekNumber);
      if (!Number.isInteger(weekNum) || weekNum < 1) {
        sendBadRequest(res, 'Invalid weekNumber: must be positive integer');
        return;
      }
      filter.weekNumber = weekNum;
    }

    // Get total count
    const total = await Recommendation.countDocuments(filter);

    // Fetch recommendations with projection (exclude full content for performance)
    const recommendations = await Recommendation.find(filter)
      .select('-content -userFeedbackContext') // Exclude large fields
      .populate('trainingPlanId', 'name')
      .sort({ createdAt: -1 })
      .skip(queryOffset)
      .limit(queryLimit)
      .lean();

    // Add content preview (first 200 chars)
    const recommendationsWithPreview = recommendations.map((rec) => ({
      id: rec._id,
      trainingPlan: {
        id: rec.trainingPlanId._id,
        name: rec.trainingPlanId.name,
      },
      weekNumber: rec.weekNumber,
      contentPreview: rec.content?.substring(0, 200) || '',
      isRegenerated: rec.isRegenerated,
      createdAt: rec.createdAt,
    }));

    sendSuccess(res, {
      recommendations: recommendationsWithPreview,
      pagination: {
        total,
        limit: queryLimit,
        offset: queryOffset,
        hasMore: queryOffset + queryLimit < total,
      },
    });
  } catch (error) {
    log.error('Error fetching recommendation history', error);
    sendInternalError(res, 'Failed to fetch recommendation history');
  }
};
```

---

## Route Definitions

**File**: `apps/api/src/routes/recommendations.ts` (add new routes)

```typescript
import { Router } from 'express';
import {
  getRecommendationById,
  getUserRecommendationHistory,
} from '../controllers/recommendation.controller';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// Existing routes...
router.post('/generate', authenticateJWT, ...);
router.post('/generate-with-plan', authenticateJWT, ...); // Modified to store recommendation

// New routes
router.get('/user/history', authenticateJWT, getUserRecommendationHistory);
router.get('/:id', authenticateJWT, getRecommendationById);

export { router as recommendationsRouter };
```

**Route Order**: The `/user/history` route MUST come before `/:id` to avoid path collision.

---

## Validation Schemas

**File**: `apps/api/src/validators/recommendations.validator.ts` (add new schemas)

```typescript
import { z } from 'zod';

// Existing schemas...

// Get recommendation by ID - path parameter validation
export const recommendationIdParamSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid recommendation ID format'),
});

// User history query parameters validation
export const recommendationHistoryQuerySchema = z.object({
  trainingPlanId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid training plan ID format')
    .optional(),
  weekNumber: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => Number.isInteger(val) && val >= 1, {
      message: 'Week number must be positive integer',
    })
    .optional(),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 100, {
      message: 'Limit must be between 1 and 100',
    })
    .optional()
    .default('20'),
  offset: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 0, {
      message: 'Offset must be non-negative',
    })
    .optional()
    .default('0'),
});
```

---

## Frontend API Client Updates

**File**: `apps/web/lib/api.ts` (add new functions)

```typescript
export const recommendationsApi = {
  // Existing functions...

  // Get single recommendation
  getRecommendation: async (id: string): Promise<{
    id: string;
    userId: string;
    trainingPlan: {
      id: string;
      name: string;
      currentWeek: number;
    };
    weekNumber: number;
    content: string;
    userFeedbackContext: string | null;
    isRegenerated: boolean;
    previousRecommendationId: string | null;
    createdAt: string;
    updatedAt: string;
  }> => {
    return api.get(`api/recommendations/${id}`).json();
  },

  // Get user recommendation history
  getUserHistory: async (params?: {
    trainingPlanId?: string;
    weekNumber?: number;
    limit?: number;
    offset?: number;
  }): Promise<{
    recommendations: Array<{
      id: string;
      trainingPlan: {
        id: string;
        name: string;
      };
      weekNumber: number;
      contentPreview: string;
      isRegenerated: boolean;
      createdAt: string;
    }>;
    pagination: {
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    };
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.trainingPlanId) searchParams.set('trainingPlanId', params.trainingPlanId);
    if (params?.weekNumber) searchParams.set('weekNumber', params.weekNumber.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());

    const queryString = searchParams.toString();
    const url = `api/recommendations/user/history${queryString ? `?${queryString}` : ''}`;

    return api.get(url).json();
  },
};
```

---

## Testing Endpoints

### Manual Testing with curl

**1. Generate recommendation and capture ID**
```bash
curl -X POST http://localhost:3001/api/recommendations/generate-with-plan \
  -H "Authorization: Bearer <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"planId":"507f1f77bcf86cd799439011"}' \
  -D - # Show headers including X-Recommendation-Id
```

**2. Get recommendation by ID**
```bash
curl http://localhost:3001/api/recommendations/507f191e810c19729de860ea \
  -H "Authorization: Bearer <jwt_token>"
```

**3. Get user history**
```bash
curl http://localhost:3001/api/recommendations/user/history \
  -H "Authorization: Bearer <jwt_token>"
```

**4. Get filtered history**
```bash
curl "http://localhost:3001/api/recommendations/user/history?trainingPlanId=507f1f77bcf86cd799439011&weekNumber=8" \
  -H "Authorization: Bearer <jwt_token>"
```

---

### POST /api/feedback (Validation Update)

**Purpose**: Update existing feedback submission endpoint to validate that recommendationId references an actual stored recommendation

**Changes Required**: Add recommendation existence and ownership validation

#### Current Issue

The existing POST `/api/feedback` endpoint accepts any valid MongoDB ObjectId as `recommendationId` without verifying:
1. The recommendation actually exists in the database
2. The recommendation belongs to the authenticated user

This can lead to:
- Feedback linked to non-existent recommendations
- Feedback linked to other users' recommendations
- Invalid data integrity

#### Required Validation

Add the following validation after the existing ObjectId format check in `apps/api/src/controllers/feedback.controller.ts`:

```typescript
// After existing: if (!mongoose.Types.ObjectId.isValid(recommendationId)) { ... }

// NEW: Verify recommendation exists
const recommendation = await Recommendation.findById(recommendationId);

if (!recommendation) {
  sendNotFound(res, 'Recommendation not found');
  return;
}

// NEW: Verify ownership
if (recommendation.userId.toString() !== userId) {
  sendForbidden(res, 'This recommendation does not belong to you');
  return;
}

// Continue with existing duplicate feedback check...
```

#### Additional Error Responses

**404 Not Found** - Recommendation doesn't exist
```json
{
  "error": "Recommendation not found"
}
```

**403 Forbidden** - Recommendation doesn't belong to user
```json
{
  "error": "This recommendation does not belong to you"
}
```

#### Import Required

Add import at top of `feedback.controller.ts`:
```typescript
import { Recommendation } from '../models/Recommendation';
```

---

## Testing Endpoints

### Integration Test Cases

1. **Test recommendation storage during generation**
   - Generate recommendation
   - Verify `X-Recommendation-Id` header present
   - Query database for stored recommendation
   - Verify content matches streamed content

2. **Test ownership validation**
   - User A generates recommendation
   - User B attempts to access User A's recommendation
   - Verify 403 Forbidden response

3. **Test history filtering**
   - Generate multiple recommendations for different plans/weeks
   - Query with various filter combinations
   - Verify correct recommendations returned

4. **Test pagination**
   - Generate 30+ recommendations
   - Request with limit=10, offset=0
   - Verify 10 results returned and hasMore=true
   - Request with limit=10, offset=10
   - Verify next 10 results

5. **Test feedback linking**
   - Generate recommendation and capture ID
   - Submit feedback with recommendation ID
   - Verify feedback document references correct recommendation
   - Verify feedback cannot be submitted twice for same recommendation
