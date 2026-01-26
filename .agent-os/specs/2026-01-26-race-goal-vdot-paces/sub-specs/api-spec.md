# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2026-01-26-race-goal-vdot-paces/spec.md

## Endpoints

### POST /api/training-plan (Modified)

**Purpose:** Upload training plan with mandatory race goal

**Request Body Changes:**

```typescript
// Existing fields
{
  planContent: string;  // The training plan text/file content
  // ... other existing fields

  // NEW: Required race goal fields
  raceGoal: {
    distance: number;           // 5000 | 10000 | 21097.5 | 42195
    targetTimeSeconds: number;  // Total seconds (e.g., 5400 for 1:30:00)
  }
}
```

**Validation (Zod Schema):**

```typescript
const raceDistances = [5000, 10000, 21097.5, 42195] as const;

const timeMinimums: Record<number, number> = {
  5000: 755,      // 12:35 - 5K WR
  10000: 1571,    // 26:11 - 10K WR
  21097.5: 3450,  // 57:30 - HM WR
  42195: 7235     // 2:00:35 - Marathon WR
};

const timeMaximums: Record<number, number> = {
  5000: 3600,     // 1:00:00
  10000: 7200,    // 2:00:00
  21097.5: 14400, // 4:00:00
  42195: 25200    // 7:00:00
};

const raceGoalSchema = z.object({
  distance: z.number().refine(
    (val) => raceDistances.includes(val as typeof raceDistances[number]),
    { message: "Invalid race distance" }
  ),
  targetTimeSeconds: z.number()
    .int()
    .positive()
}).refine(
  (data) => data.targetTimeSeconds >= timeMinimums[data.distance],
  { message: "Time is faster than world record for this distance" }
).refine(
  (data) => data.targetTimeSeconds <= timeMaximums[data.distance],
  { message: "Time exceeds reasonable race cutoff for this distance" }
);
```

**Response (Success - 200):**

```typescript
{
  success: true;
  data: {
    planId: string;
    raceGoal: {
      distance: number;
      distanceLabel: string;
      targetTimeSeconds: number;
      vdot: number;
      paces: {
        easy: { minPace: number; maxPace: number };
        longRun: { minPace: number; maxPace: number };
        marathon: { minPace: number; maxPace: number };
        threshold: { minPace: number; maxPace: number };
        interval: { minPace: number; maxPace: number };
        repetition: { minPace: number; maxPace: number };
      };
    };
  };
}
```

**Response (Validation Error - 400):**

```typescript
{
  success: false;
  error: {
    code: "VALIDATION_ERROR";
    message: string;
    details: {
      field: string;
      message: string;
    }[];
  };
}
```

### GET /api/user/paces

**Purpose:** Retrieve current user's calculated training paces

**Authentication:** Required (JWT)

**Response (Success - 200):**

```typescript
{
  success: true;
  data: {
    raceGoal: {
      distance: number;
      distanceLabel: string;
      targetTimeSeconds: number;
      vdot: number;
      paces: {
        easy: { minPace: number; maxPace: number; formatted: string };
        longRun: { minPace: number; maxPace: number; formatted: string };
        marathon: { minPace: number; maxPace: number; formatted: string };
        threshold: { minPace: number; maxPace: number; formatted: string };
        interval: { minPace: number; maxPace: number; formatted: string };
        repetition: { minPace: number; maxPace: number; formatted: string };
      };
      calculatedAt: string;  // ISO date
    } | null;
  };
}
```

**Response (No Paces Set - 200):**

```typescript
{
  success: true;
  data: {
    raceGoal: null;
  };
}
```

**Notes:**
- `formatted` field provides human-readable pace: "5:30 - 6:00 /km"
- Returns null if user hasn't uploaded a training plan with race goal

### PUT /api/user/race-goal

**Purpose:** Update race goal and recalculate paces (without uploading new plan)

**Authentication:** Required (JWT)

**Request Body:**

```typescript
{
  distance: number;           // 5000 | 10000 | 21097.5 | 42195
  targetTimeSeconds: number;  // Total seconds
}
```

**Validation:** Same as POST /api/training-plan race goal validation

**Response (Success - 200):**

```typescript
{
  success: true;
  data: {
    raceGoal: {
      // Same structure as GET /api/user/paces
    };
  };
}
```

**Notes:**
- Allows users to update race goal without re-uploading entire plan
- Recalculates VDOT and all training paces
- Updates `calculatedAt` timestamp

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request body validation failed |
| `UNAUTHORIZED` | 401 | Missing or invalid JWT |
| `INVALID_DISTANCE` | 400 | Distance not in allowed values |
| `TIME_BELOW_MINIMUM` | 400 | Target time faster than world record |
| `TIME_ABOVE_MAXIMUM` | 400 | Target time exceeds race cutoff |

## Controller Logic

### Training Plan Upload Controller

```
1. Validate request body (including race goal)
2. Parse and store training plan content
3. Calculate VDOT from race goal
4. Derive training paces from VDOT
5. Map distance to label (5000 → "5K", etc.)
6. Update user document with raceGoal object
7. Return success with calculated paces
```

### Recommendation Generation (Internal)

When generating recommendations, the service should:

```
1. Fetch user's training plan
2. Check if plan contains embedded pace definitions
3. IF plan has paces:
     - Use plan paces in AI prompt
     - Add note: "These paces are from the athlete's training plan"
4. ELSE IF user has calculated raceGoal.paces:
     - Use calculated paces in AI prompt
     - Add note: "These paces are calculated from the athlete's race goal"
5. ELSE:
     - Generate recommendation without specific paces
```
