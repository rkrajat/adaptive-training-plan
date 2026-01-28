# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2026-01-28-training-status-indicator/spec.md

## Technical Requirements

### Training Status Types

Define three status types with associated metadata:

```typescript
type TrainingStatus = 'on_track' | 'slightly_off_track' | 'off_track';

interface TrainingStatusResponse {
  status: TrainingStatus;
  rationale: string; // 1-2 sentences
  confidence: number; // 0-100, must be >= 90
  currentWeek: number;
  eligibleForStatus: boolean;
}
```

### Status Display Mapping

| Status | Display Text | Color | Icon |
|--------|-------------|-------|------|
| `on_track` | "On Track" | Green (#22c55e) | CheckCircle |
| `slightly_off_track` | "Slightly Off Track" | Yellow/Amber (#eab308) | AlertTriangle |
| `off_track` | "Off Track" | Red (#ef4444) | XCircle |

### Week Calculation Logic

```typescript
const calculateCurrentWeek = (planStartDate: Date): number => {
  const now = new Date();
  const diffTime = now.getTime() - planStartDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.floor(diffDays / 7) + 1;
};
```

### Eligibility Rules

The status indicator should only be shown when ALL conditions are met:
1. User has an active training plan
2. Training plan has a valid start date
3. Current week >= 2
4. User has at least some Strava activities in the last 14 days

### LLM System Prompt

```
You are an expert running coach assistant. Your sole task is to assess whether a runner's training is on track based on their recent activity data compared to their training plan.

## Your Role
- Analyze training adherence objectively
- Provide a single status assessment with brief rationale
- Be conservative - only mark as "on_track" when truly confident

## Confidence Requirement
You must be at least 90% confident in your assessment. If you cannot reach this confidence level due to insufficient data, respond with status "slightly_off_track" and explain the data limitations in your rationale.

## Status Definitions

**on_track**: The runner is executing their training plan within acceptable variance. This means:
- Completing 80%+ of planned runs
- Distances within 15% of targets
- Run types generally match plan (long runs, easy runs, tempo runs happening as scheduled)

**slightly_off_track**: Minor deviations that don't significantly impact training goals:
- Completing 60-80% of planned runs
- Some workouts missed or modified
- Distances 15-30% off target
- Minor scheduling adjustments

**off_track**: Significant deviation from training plan:
- Completing less than 60% of planned runs
- Major workouts (long runs, key sessions) consistently missed
- Distances more than 30% off target
- Extended gaps in training

## Experience Level Consideration
- **Beginner**: More lenient thresholds, expect more variance
- **Intermediate**: Standard thresholds as defined above
- **Expert**: Tighter expectations, these runners should hit their marks more precisely

## Output Format
Respond ONLY with valid JSON in this exact format:
{
  "status": "on_track" | "slightly_off_track" | "off_track",
  "rationale": "One to two sentences explaining the assessment.",
  "confidence": <number between 90-100>
}
```

### LLM User Prompt Template

```
## Training Plan Context
- Plan Start Date: {planStartDate}
- Current Week: {currentWeek}
- Runner Experience: {experienceLevel}

## Training Plan (Current Week's Schedule)
{trainingPlanForCurrentWeek}

## Training Plan (Previous Week's Schedule)
{trainingPlanForPreviousWeek}

## Actual Activities (Last 14 Days)
{formattedActivities}

Each activity includes: date, type, distance (km), duration, average pace, average heart rate (if available).

## Assessment Request
Based on the above data, determine if this runner's training is on track, slightly off track, or off track. Consider:
1. How many planned runs were completed vs skipped
2. Whether distances match the plan
3. If key workouts (long runs, tempo runs) were executed
4. The runner's experience level when setting expectations

Provide your assessment in the required JSON format.
```

### Activity Formatting

Format the last 14 days of activities as a structured table:

```
| Date | Type | Distance (km) | Duration | Pace (min/km) | Avg HR |
|------|------|---------------|----------|---------------|--------|
| 2026-01-27 | Run | 8.5 | 48:30 | 5:42 | 145 |
| 2026-01-25 | Run | 12.2 | 1:05:15 | 5:21 | 152 |
...
```

### API Endpoint Design

**Endpoint**: `POST /api/training-status`

**Request Body**: None required (uses authenticated user context)

**Response**:
```typescript
// Success (200)
{
  status: 'on_track' | 'slightly_off_track' | 'off_track';
  rationale: string;
  currentWeek: number;
}

// Not Eligible (200)
{
  eligibleForStatus: false;
  reason: 'no_active_plan' | 'week_one' | 'no_recent_activities';
}

// Error (500)
{
  error: string;
}
```

### Frontend Component Structure

```
TrainingStatusBanner/
├── index.ts
├── TrainingStatusBanner.tsx
├── types.ts
├── constants.ts
└── TrainingStatusBanner.test.tsx
```

### Component States

1. **Loading**: Show skeleton/shimmer while fetching status
2. **Not Eligible**: Render nothing (null) - no visual indication
3. **Success**: Show status banner with icon, text, and rationale
4. **Error**: Show subtle error state or render nothing (fail gracefully)

### UI/UX Specifications

- **Position**: Top of dashboard, above all other content
- **Width**: Full container width with standard padding
- **Height**: Auto-height based on content, approximately 60-80px
- **Border Radius**: Consistent with design system (rounded-lg)
- **Shadow**: Subtle shadow for prominence
- **Animation**: Fade-in on load, no status change animations needed

### Caching Strategy

- Cache status response for 1 hour (user's training status doesn't change frequently)
- Invalidate cache when:
  - New Strava sync completes
  - Training plan is updated
  - User manually requests refresh

### Performance Considerations

- Use TanStack Query with `staleTime: 60 * 60 * 1000` (1 hour)
- Lazy load the status endpoint after initial dashboard render
- Don't block dashboard rendering waiting for status
