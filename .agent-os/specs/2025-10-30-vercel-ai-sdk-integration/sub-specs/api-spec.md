# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-10-30-vercel-ai-sdk-integration/spec.md

## Endpoints

### POST /api/recommendations/generate

**Purpose:** Generate AI-powered training recommendations based on the authenticated user's past 30 days of Strava running activities. Streams the response using Server-Sent Events (SSE) for real-time UI updates.

**Authentication:** Required (JWT Bearer token)

**Headers:**
```http
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

**Request Body:**
```typescript
{
  regenerate?: boolean  // Optional flag to indicate this is a regeneration request
}
```

**Request Body Schema (Zod):**
```typescript
import { z } from 'zod';

const generateRecommendationSchema = z.object({
  regenerate: z.boolean().optional().default(false),
});
```

**Response Format:**

**Success Response (Streaming):**
- **Status Code:** 200 OK
- **Headers:**
  - `Content-Type: text/event-stream; charset=utf-8`
  - `Cache-Control: no-cache`
  - `Connection: keep-alive`
  - `X-Vercel-AI-Data-Stream: v1`
- **Body:** Server-Sent Events stream with AI-generated text in Vercel AI SDK data stream format

**Example Streamed Response:**
```
0:"## Performance Analysis\n\n"
0:"Your recent training shows consistent "
0:"effort with 4 runs totaling 42.3km. "
0:"Your average heart rate of 152 bpm suggests you're training at a moderate intensity"
0:", which is good for building aerobic base. "
0:"However, I notice your pace has been slowing slightly over the past two weeks"
0:", indicating potential fatigue accumulation.\n\n"
0:"## Recommended Adjustments\n\n"
0:"1. **Reduce Weekly Volume by 15%** - Drop to 36km this week"
0:" to allow for recovery and prevent overtraining.\n"
0:"2. **Add One Easy Recovery Run** - Include a 5km run at conversational pace"
0:" (HR below 140 bpm) to promote active recovery.\n"
0:"3. **Incorporate One Interval Session** - 6x800m at 5k pace"
0:" with 90-second recovery to build speed without excessive volume.\n"
0:"4. **Prioritize Sleep and Nutrition** - Aim for 8+ hours of sleep"
0:" and increased protein intake (1.6g per kg body weight) to support recovery.\n"
```

**Error Responses:**

**401 Unauthorized** - Missing or invalid JWT token
```json
{
  "error": "Authentication required",
  "message": "No token provided or token is invalid"
}
```

**500 Internal Server Error** - OpenAI API error, network error, or server error
```json
{
  "error": "Failed to generate recommendations",
  "message": "Unable to connect to AI service. Please try again later.",
  "details": "OpenAI API error: Invalid API key"
}
```

**503 Service Unavailable** - Rate limit exceeded
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again in a few minutes.",
  "retryAfter": 60
}
```

**Example Error Response (Streaming):**
If an error occurs during streaming, the stream will be terminated and an error event will be sent:
```
3:{"error":"Rate limit exceeded","message":"Too many requests to OpenAI API"}
```

## Controllers

### recommendationsController

**File:** `/apps/api/src/routes/recommendations.ts`

**Exported Function:** `recommendationsRouter` (Express Router)

**Handler Function:** `generateRecommendations` (arrow function)

**Business Logic:**

1. **Request Validation:**
   - Validate request body against Zod schema
   - Extract `regenerate` flag (defaults to `false`)

2. **User Authentication:**
   - JWT middleware (`authenticateJWT`) extracts user ID from token
   - Attach user ID to `req.user` object

3. **Fetch User Activities:**
   - Query internal database for user's Strava access token
   - Call Strava API to fetch last 30 days of activities
   - Filter for "Run" type activities only
   - Extract relevant data: distance, moving time, average heart rate, start date, activity name

4. **Construct LLM Prompt:**
   - Format activity data into structured text
   - Include summary statistics: total distance, average pace, average heart rate, number of runs
   - System message: "You are an expert running coach analyzing training data to provide personalized recommendations."
   - User message: Activity summary + request for performance analysis and 4 specific recommended adjustments
   - Specify output format: Markdown with "## Performance Analysis" and "## Recommended Adjustments" sections

5. **Call OpenAI API via Vercel AI SDK:**
   - Initialize OpenAI provider: `import { openai } from '@ai-sdk/openai'`
   - Configure model: `gpt-4o-mini`
   - Set parameters: `temperature: 0.7`, `maxTokens: 800`
   - Use `streamText` function from `ai` package
   - Stream response to client using `toDataStreamResponse()`

6. **Error Handling:**
   - Catch OpenAI API errors (invalid key, rate limits, network issues)
   - Catch Strava API errors (token expired, network issues)
   - Catch database errors (user not found, connection issues)
   - Return appropriate HTTP status codes and error messages
   - Log errors for debugging (use `console.error` with context)

**Example Prompt Construction:**
```typescript
const prompt = `You are an expert running coach analyzing training data.

Here is the runner's activity data from the past 30 days:

${activities.map((activity, index) => `
${index + 1}. ${activity.name} (${new Date(activity.startDate).toLocaleDateString()})
   - Distance: ${(activity.distance / 1000).toFixed(2)} km
   - Duration: ${Math.floor(activity.movingTime / 60)} minutes
   - Pace: ${calculatePace(activity.distance, activity.movingTime)} /km
   ${activity.averageHeartrate ? `- Avg Heart Rate: ${activity.averageHeartrate} bpm` : ''}
`).join('\n')}

Summary:
- Total runs: ${activities.length}
- Total distance: ${totalDistance.toFixed(1)} km
- Average pace: ${averagePace} /km
- Average heart rate: ${averageHeartRate ? `${averageHeartRate} bpm` : 'N/A'}

Based on this data, please provide:

1. A performance analysis paragraph (3-5 sentences) summarizing the runner's recent training patterns, strengths, and areas for improvement.

2. Four specific recommended adjustments for the upcoming week to optimize training effectiveness.

Format your response in Markdown with the following structure:

## Performance Analysis

[Your analysis here]

## Recommended Adjustments

1. **[Title]** - [Description]
2. **[Title]** - [Description]
3. **[Title]** - [Description]
4. **[Title]** - [Description]

Be encouraging, data-driven, and actionable in your recommendations.`;
```

**Route Registration:**
```typescript
// In /apps/api/src/index.ts
import { recommendationsRouter } from './routes/recommendations';

app.use('/api/recommendations', recommendationsRouter);
```

## Integration with Existing Features

### Authentication Flow
- Recommendations endpoint uses the same `authenticateJWT` middleware as `/api/activities`
- User must be logged in with valid JWT token
- Token is verified and user ID is extracted before processing request
- If token is invalid or expired, returns 401 Unauthorized

### Strava Activities Integration
- Recommendations controller reuses the same Strava API logic from `/api/activities` endpoint
- Fetches last 30 days of activities using user's Strava access token from database
- Filters for "Run" type activities only
- Uses the same `Activity` TypeScript interface from `/packages/types/src/strava.ts`

### Frontend API Client Pattern
- Follows the same pattern as `authApi` and `activitiesApi` in `/apps/web/lib/api.ts`
- Uses native `fetch` API instead of `ky` to support streaming responses
- Automatically includes JWT token from localStorage in Authorization header
- Returns raw `Response` object for streaming consumption by `useCompletion` hook

## Performance Optimization

### Token Usage
- Estimated tokens per request: 500-800 input tokens (activity data + prompt), 300-600 output tokens (response)
- Total: ~800-1400 tokens per request
- Cost (GPT-4o-mini): ~$0.001-0.002 per request

### Streaming Benefits
- First token appears within 1-2 seconds (vs 5-10 seconds for full response)
- Improved perceived performance and user experience
- Reduced client-side timeout risk

### Rate Limiting Considerations
- OpenAI free tier: 3 requests per minute (RPM), 200 requests per day (RPD)
- OpenAI paid tier: Higher limits based on usage tier
- No additional rate limiting implemented in v1 (rely on OpenAI's limits)
- Future enhancement: Implement rate limiting middleware using `express-rate-limit`

## Security Considerations

### API Key Protection
- `OPENAI_API_KEY` stored in backend `.env` file (never exposed to frontend)
- `.env` file is gitignored (not committed to version control)
- API key is validated on first request (fail fast if invalid)

### Authentication
- All requests require valid JWT token
- Token is verified before processing any AI generation requests
- User can only generate recommendations for their own data (user ID from token)

### Data Privacy
- User activity data is sent to OpenAI API for processing
- OpenAI API data usage policy: Data is not used for model training (as of OpenAI API v1 policy)
- No user data is stored in logs or error messages (redact sensitive information)

### Error Message Sanitization
- Internal error details are logged server-side only
- User-facing error messages are generic and don't expose implementation details
- Example: "Unable to generate recommendations" instead of "OpenAI API key is invalid"
