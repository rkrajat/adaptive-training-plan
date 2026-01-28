# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2026-01-28-training-status-indicator/spec.md

## Endpoints

### POST /api/training-status

**Purpose:** Generate and return the user's training status based on LLM analysis of their training plan adherence over the last two weeks.

**Authentication:** Required (JWT token in Authorization header)

**Request Body:** None required - all data is fetched server-side based on authenticated user.

**Response Format:**

#### Success Response (200 OK) - Eligible User

```json
{
  "status": "on_track",
  "rationale": "You've completed all 4 planned runs this week with distances within 10% of targets. Your long run on Sunday was particularly well-executed.",
  "currentWeek": 4
}
```

#### Success Response (200 OK) - Slightly Off Track

```json
{
  "status": "slightly_off_track",
  "rationale": "You completed 3 of 5 planned runs this week. Your midweek tempo run was missed, but your weekend long run was on target.",
  "currentWeek": 6
}
```

#### Success Response (200 OK) - Off Track

```json
{
  "status": "off_track",
  "rationale": "Only 2 of 6 planned runs were completed in the last two weeks. Consider reviewing your schedule or adjusting your plan to better fit your availability.",
  "currentWeek": 3
}
```

#### Success Response (200 OK) - Not Eligible

```json
{
  "eligibleForStatus": false,
  "reason": "week_one"
}
```

Possible `reason` values:
- `no_active_plan`: User doesn't have an active training plan
- `week_one`: User is in week 1 of their plan
- `no_recent_activities`: No Strava activities found in the last 14 days
- `no_plan_start_date`: Training plan doesn't have a start date configured

#### Error Response (500 Internal Server Error)

```json
{
  "error": "Failed to generate training status"
}
```

### Controller Logic

```typescript
// POST /api/training-status
export const getTrainingStatus = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    // 1. Fetch user's active training plan
    const trainingPlan = await TrainingPlan.findOne({ userId, status: 'active' });

    if (!trainingPlan) {
      return res.json({ eligibleForStatus: false, reason: 'no_active_plan' });
    }

    if (!trainingPlan.startDate) {
      return res.json({ eligibleForStatus: false, reason: 'no_plan_start_date' });
    }

    // 2. Calculate current week
    const currentWeek = calculateCurrentWeek(trainingPlan.startDate);

    if (currentWeek < 2) {
      return res.json({ eligibleForStatus: false, reason: 'week_one' });
    }

    // 3. Fetch last 14 days of Strava activities
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const activities = await StravaActivity.find({
      userId,
      startDate: { $gte: twoWeeksAgo }
    }).sort({ startDate: -1 });

    if (activities.length === 0) {
      return res.json({ eligibleForStatus: false, reason: 'no_recent_activities' });
    }

    // 4. Fetch user profile for experience level
    const userProfile = await UserProfile.findOne({ userId });
    const experienceLevel = userProfile?.runningExperience || 'intermediate';

    // 5. Call AI service to generate status
    const statusResult = await aiService.generateTrainingStatus({
      trainingPlan,
      activities,
      currentWeek,
      experienceLevel,
      planStartDate: trainingPlan.startDate
    });

    return res.json({
      status: statusResult.status,
      rationale: statusResult.rationale,
      currentWeek
    });

  } catch (error) {
    console.error('Training status generation failed:', error);
    return res.status(500).json({ error: 'Failed to generate training status' });
  }
};
```

### AI Service Method

Add to `apps/api/src/services/ai.service.ts`:

```typescript
interface GenerateTrainingStatusParams {
  trainingPlan: TrainingPlanDocument;
  activities: StravaActivityDocument[];
  currentWeek: number;
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  planStartDate: Date;
}

interface TrainingStatusResult {
  status: 'on_track' | 'slightly_off_track' | 'off_track';
  rationale: string;
  confidence: number;
}

async generateTrainingStatus(params: GenerateTrainingStatusParams): Promise<TrainingStatusResult> {
  const systemPrompt = this.buildStatusSystemPrompt();
  const userPrompt = this.buildStatusUserPrompt(params);

  const response = await this.openai.chat.completions.create({
    model: config.openai.model,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.3, // Lower temperature for more consistent status
    response_format: { type: 'json_object' }
  });

  const result = JSON.parse(response.choices[0].message.content);

  // Validate confidence threshold
  if (result.confidence < 90) {
    // Log warning but still return result
    console.warn('Training status confidence below threshold:', result.confidence);
  }

  return {
    status: result.status,
    rationale: result.rationale,
    confidence: result.confidence
  };
}
```

### Route Registration

Add to `apps/api/src/routes/index.ts` or create `apps/api/src/routes/training-status.ts`:

```typescript
import { Router } from 'express';
import { getTrainingStatus } from '../controllers/training-status.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/training-status', authenticate, getTrainingStatus);

export default router;
```

### Data Dependencies

The endpoint requires access to:
1. **TrainingPlan collection**: User's active training plan with start date and weekly schedule
2. **StravaActivity collection**: User's synced activities from the last 14 days
3. **UserProfile collection**: User's running experience level
4. **OpenAI API**: For LLM-based status determination

### Rate Limiting

- Apply standard API rate limits
- Consider caching response for 1 hour per user to reduce LLM calls
- Cache key: `training-status:${userId}`
