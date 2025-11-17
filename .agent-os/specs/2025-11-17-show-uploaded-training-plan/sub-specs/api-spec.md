# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-11-17-show-uploaded-training-plan/spec.md

## Endpoints

### GET /api/training-plans

**Purpose:** Retrieve user's training plans with optional filtering for active plans

**Current Behavior:**
- Returns array of training plans WITHOUT csvContent
- Uses `formatTrainingPlan` which excludes csvContent field

**Required Changes:**
- When `isActive=true` query parameter is present, include csvContent in response
- Conditionally use `formatTrainingPlanWithContent` instead of `formatTrainingPlan`

**Parameters:**
- `isActive` (query, optional, boolean): Filter for active training plans

**Response Format:**

When `isActive=true`:
```typescript
{
  plans: TrainingPlanWithContent[]
}
```

When `isActive` is not specified or false:
```typescript
{
  plans: TrainingPlan[]
}
```

**TrainingPlanWithContent Type:**
```typescript
interface TrainingPlanWithContent {
  id: string;
  userId: string;
  metadata: {
    name: string;
    goal?: string;
    startDate: string;
    endDate: string;
    totalWeeks: number;
  };
  source: 'user_upload' | 'ai_generated';
  isActive: boolean;
  currentWeek: number;
  startDate: string;
  createdAt: string;
  updatedAt: string;
  csvContent: string; // This is the new field to include
}
```

**Implementation Location:**
- File: `apps/api/src/services/training-plan.service.ts`
- Method: `getUserTrainingPlans`
- Lines: ~184-200

**Example Request:**
```
GET /api/training-plans?isActive=true
Authorization: Bearer <token>
```

**Example Response:**
```json
{
  "plans": [
    {
      "id": "507f1f77bcf86cd799439011",
      "userId": "507f191e810c19729de860ea",
      "metadata": {
        "name": "Marathon Training Plan",
        "goal": "Sub-4 hour marathon",
        "startDate": "2025-01-01",
        "endDate": "2025-04-15",
        "totalWeeks": 16
      },
      "source": "user_upload",
      "isActive": true,
      "currentWeek": 3,
      "startDate": "2025-01-01",
      "createdAt": "2025-01-01T00:00:00.000Z",
      "updatedAt": "2025-01-01T00:00:00.000Z",
      "csvContent": "week,day,workout_type,distance_km,pace,notes\n1,Monday,Easy Run,5,5:30,Recovery pace\n1,Tuesday,Rest,0,,\n..."
    }
  ]
}
```

**Error Responses:**
- 401 Unauthorized: Missing or invalid authentication token
- 500 Internal Server Error: Database or server error

**Notes:**
- The csvContent field is only included when explicitly needed (isActive=true) to reduce payload size for list operations
- Existing GET /api/training-plans/:id endpoint already returns csvContent, so no changes needed there
- This approach maintains backward compatibility for clients not requesting active plans
