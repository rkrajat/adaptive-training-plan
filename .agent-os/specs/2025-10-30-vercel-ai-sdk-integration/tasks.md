# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-10-30-vercel-ai-sdk-integration/spec.md

> Created: 2025-10-30
> Status: Ready for Implementation

## Tasks

### 1. Backend Setup and Configuration

- [x] 1.1 Install Vercel AI SDK and OpenAI packages in backend API workspace using `pnpm add ai openai --filter api`
- [x] 1.2 Add `OPENAI_API_KEY` environment variable to `/apps/api/.env` file with placeholder value and documentation comment
- [x] 1.3 Create `/apps/api/src/routes/recommendations.ts` route file with Express Router boilerplate following existing route patterns
- [x] 1.4 Add TypeScript interfaces for request validation schema using Zod (`generateRecommendationSchema`)
- [x] 1.5 Register recommendations router in `/apps/api/src/index.ts` with path `/api/recommendations`

### 2. Backend Streaming Endpoint Implementation

- [x] 2.1 Implement `generateRecommendations` handler function with JWT authentication middleware (`authenticateJWT`)
- [x] 2.2 Add request body validation using Zod schema (`generateRecommendationSchema`) with `regenerate` boolean flag
- [x] 2.3 Implement user activity fetching logic: query database for Strava access token and fetch last 30 days of activities from Strava API. If the current token is expired, call Strava APIs to generate a refresh token and then continue.
- [x] 2.4 Create prompt construction function that formats activity data (distance, pace, heart rate, dates) into structured LLM prompt with system and user messages
- [x] 2.5 Initialize OpenAI provider using `import { openai } from '@ai-sdk/openai'` and configure model `gpt-4o-mini` with temperature `0.7` and maxTokens `800`
- [x] 2.6 Implement streaming response using `streamText` function from Vercel AI SDK and pipe to client with `toDataStreamResponse()`
- [x] 2.7 Add comprehensive error handling for OpenAI API errors (invalid key, rate limits), Strava API errors (token expired), and database errors with appropriate HTTP status codes (401, 500, 503)
- [x] 2.8 Test endpoint manually with curl/Postman to verify streaming response format and content
- [x] 2.9 Verify all backend tests pass with `pnpm test --filter api`

### 3. Frontend Setup and API Client

- [x] 3.1 Install Vercel AI SDK React package in web workspace using `pnpm add ai --filter web`
- [x] 3.2 Write unit tests for new API client method in `/apps/web/lib/api.test.ts` (if test file exists, otherwise create it)
- [x] 3.3 Add `recommendationsApi` object to `/apps/web/lib/api.ts` following existing `authApi` and `activitiesApi` patterns
- [x] 3.4 Implement `generate` method in `recommendationsApi` using native `fetch` API (not `ky`) with JWT token in Authorization header and optional `regenerate` boolean parameter
- [x] 3.5 Return raw `Response` object from `generate` method to support streaming consumption by Vercel AI SDK hooks
- [x] 3.6 Verify API client tests pass with `pnpm test --filter web`

### 4. Frontend Dashboard Integration

- [x] 4.1 Import `useCompletion` hook from `ai/react` in `/apps/web/app/dashboard/page.tsx`
- [x] 4.2 Configure `useCompletion` hook with API endpoint URL (using `NEXT_PUBLIC_API_URL` environment variable), Authorization header with JWT token, and error/finish callbacks
- [x] 4.3 Replace hardcoded recommendation content (lines 178-223) with dynamic content from `completion.completion` state
- [x] 4.4 Parse streamed content to separate Performance Analysis and Recommended Adjustments sections using markdown parsing or string splitting
- [x] 4.5 Implement loading state UI: show skeleton loader or spinner when `completion.isLoading === true` and disable "Regenerate" button during loading
- [x] 4.6 Implement error state UI: display user-friendly error message when `completion.error` is present with "Retry" action button
- [x] 4.7 Wire up "Regenerate" button (lines 171-173) to trigger `completion.reload()` method or new mutation with `regenerate: true` flag
- [x] 4.8 Ensure recommendations are only fetched when user is authenticated using `isAuthenticated()` helper
- [x] 4.9 Test real-time streaming display: verify text appears progressively word-by-word as it's generated

### 5. End-to-End Testing and Verification

- [x] 5.1 Run linting with `pnpm lint --fix` to ensure code style compliance
- [x] 5.2 Run TypeScript compiler checks with `pnpm typecheck` to verify no type errors

