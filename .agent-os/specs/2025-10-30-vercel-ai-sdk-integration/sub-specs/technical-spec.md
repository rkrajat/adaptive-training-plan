# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-10-30-vercel-ai-sdk-integration/spec.md

## Technical Requirements

### Backend Requirements

#### Package Installation
- Install `ai` (Vercel AI SDK) version `^4.0.0` in `/apps/api` using `pnpm add ai`
- Install `openai` (OpenAI SDK) version `^4.0.0` in `/apps/api` using `pnpm add openai`
- Both packages are production dependencies, not dev dependencies

#### Environment Configuration
- Add `OPENAI_API_KEY` variable to `/apps/api/.env` file
- Document the environment variable in the API README or setup guide
- The API key will be provided by the user and should be stored securely (not committed to git)

#### New Route File: `/apps/api/src/routes/recommendations.ts`
- Create new route file following the existing pattern in `/apps/api/src/routes/auth.ts` and `/apps/api/src/routes/activities.ts`
- Use Express Router with TypeScript strict mode
- Export named export only: `export const recommendationsRouter = Router()`
- Implement arrow function handlers only (no function declarations)

#### Streaming Endpoint Implementation
- **Route**: `POST /api/recommendations/generate`
- **Middleware**: Protected by `authenticateJWT` middleware (imported from `/apps/api/src/middleware/auth.ts`)
- **Request Body Validation**: Use Zod schema to validate incoming request
  - Accept optional `regenerate: boolean` flag
  - Activities data will be fetched server-side from Strava using the authenticated user's token
- **OpenAI Configuration**:
  - Initialize OpenAI client with API key from environment variable
  - Use `openai` from Vercel AI SDK: `import { openai } from '@ai-sdk/openai'`
  - Model: `gpt-4o-mini`
  - Temperature: `0.7` for balanced creativity and consistency
- **Streaming Implementation**:
  - Use `streamText` function from Vercel AI SDK
  - Construct prompt with user's activity data (distance, pace, heart rate, dates)
  - Stream response using `toDataStreamResponse()` method
  - Set appropriate headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`
- **Error Handling**:
  - Catch OpenAI API errors (invalid key, rate limits, network issues)
  - Return appropriate HTTP status codes (401 for auth, 429 for rate limit, 500 for server errors)
  - Include user-friendly error messages in response

#### Route Registration
- Register the recommendations router in `/apps/api/src/index.ts`
- Add after existing route registrations: `app.use('/api/recommendations', recommendationsRouter)`
- Ensure consistent URL pattern with existing routes (`/api/auth/*`, `/api/activities/*`)

#### Prompt Engineering
- Construct a structured prompt that includes:
  - System message: "You are a running coach analyzing training data"
  - Context: Last 30 days of running activities with distance, pace, heart rate
  - Task: Generate a performance analysis paragraph and 4 specific recommended adjustments
  - Format: Markdown with clear sections (Performance Analysis, Recommended Adjustments)
  - Tone: Encouraging, data-driven, actionable
- Keep prompt concise to minimize token usage and latency

### Frontend Requirements

#### Package Installation
- Install `ai` (Vercel AI SDK React package) version `^4.0.0` in `/apps/web` using `pnpm add ai`
- This provides React hooks for streaming: `useCompletion`, `useChat`

#### API Client Update: `/apps/web/lib/api.ts`
- Add new `recommendationsApi` object following the pattern of `authApi` and `activitiesApi`
- Create `generate` method that uses `fetch` API (not `ky`) because Vercel AI SDK requires native `fetch` for streaming
- Method signature: `generate: (regenerate?: boolean) => Promise<Response>`
- Include JWT token in Authorization header: `Bearer ${token}`
- Return the raw `Response` object for streaming consumption

#### Dashboard Integration: `/apps/web/app/dashboard/page.tsx`
- Import `useCompletion` hook from `ai/react`
- Replace hardcoded content in lines 178-223 (Performance Analysis and Recommended Adjustments sections)
- Use TanStack Query mutation to trigger recommendation generation
- Configure `useCompletion` hook:
  - `api: '/api/recommendations/generate'` (full URL with `NEXT_PUBLIC_API_URL`)
  - `headers`: Include Authorization Bearer token
  - `onFinish`: Update UI state when streaming completes
  - `onError`: Display error message to user
- Wire up "Regenerate" button (lines 171-173) to trigger `completion.reload()` method

#### Real-Time Streaming UI
- Display streaming text using `completion.completion` state from `useCompletion` hook
- Show loading indicator when `completion.isLoading === true`
- Parse streamed content to separate Performance Analysis from Recommended Adjustments sections
- Use existing Tailwind CSS classes for styling (no custom CSS)
- Maintain existing card layout and design system (shadcn/ui components if applicable)

#### Loading States
- Show skeleton loader or spinner while `completion.isLoading === true`
- Disable "Regenerate" button during loading to prevent duplicate requests
- Display intermediate streaming text as it arrives (progressive rendering)

#### Error States
- Display user-friendly error message when `completion.error` is present
- Error message examples:
  - "Unable to generate recommendations. Please check your OpenAI API key."
  - "Rate limit exceeded. Please try again in a few minutes."
  - "Network error. Please check your connection and try again."
- Provide "Retry" action (same as "Regenerate" button)
- Keep dashboard functional even if AI generation fails (show error card instead of crashing)

#### Authentication Flow
- Ensure recommendations are only fetched when user is authenticated
- Use existing `isAuthenticated()` helper from `/apps/web/lib/auth.ts`
- Include JWT token from localStorage in all API requests
- Handle 401 Unauthorized errors by redirecting to login page

### Data Flow

1. **User visits dashboard** → Frontend checks authentication → Redirects to login if unauthenticated
2. **Authenticated user** → TanStack Query fetches activities from `/api/activities` → Stores in React state
3. **Dashboard mounts** → Automatically triggers recommendation generation via `useCompletion` hook
4. **Frontend sends request** → `POST /api/recommendations/generate` with JWT token in headers
5. **Backend receives request** → Validates JWT → Extracts user ID from token → Fetches user's Strava activities
6. **Backend constructs prompt** → Formats activity data → Sends to OpenAI API via Vercel AI SDK
7. **OpenAI streams response** → Vercel AI SDK pipes stream to frontend via `toDataStreamResponse()`
8. **Frontend receives stream** → `useCompletion` hook updates `completion.completion` state in real-time
9. **UI updates progressively** → User sees text appear word-by-word as it's generated
10. **Stream completes** → `completion.isLoading` becomes `false` → "Regenerate" button re-enables

### Performance Considerations

- **Streaming latency**: First token should appear within 1-2 seconds of request
- **Total generation time**: Full recommendation should complete within 5-10 seconds
- **Token optimization**: Keep prompts concise (under 1000 tokens) to minimize cost and latency
- **Error resilience**: Implement exponential backoff for rate limit errors (handled by OpenAI SDK)
- **Caching**: No caching in v1 (future optimization to reduce API costs)

### Code Style Compliance

All code must follow the project's strict code standards documented in `CLAUDE.md`:

- **Functions**: Arrow functions only (no function declarations)
- **Exports**: Named exports only (no default exports)
- **TypeScript**: Strict mode with explicit types (no `any` types)
- **Variables**: `const` or `let` only (no `var`), minimum 3 characters (except `id`)
- **Imports**: Type imports using `import type { ... }` syntax
- **Styling**: Tailwind CSS utility classes only (no inline styles or custom CSS)
- **Components**: Functional components with hooks only (no class components)

## External Dependencies

### ai (Vercel AI SDK)
- **Purpose**: Provides `streamText` function for streaming LLM responses and React hooks (`useCompletion`, `useChat`) for frontend integration
- **Version**: `^4.0.0`
- **Justification**: Official Vercel library with excellent TypeScript support, streaming performance, and React integration. Simplifies OpenAI streaming implementation with built-in error handling and state management.
- **Installation**:
  - Backend: `pnpm add ai --filter api`
  - Frontend: `pnpm add ai --filter web`

### openai (OpenAI SDK)
- **Purpose**: Provides OpenAI API client for GPT-4o-mini model integration
- **Version**: `^4.0.0`
- **Justification**: Official OpenAI SDK required by Vercel AI SDK for OpenAI provider support. Handles authentication, request formatting, and error handling for OpenAI API calls.
- **Installation**: `pnpm add openai --filter api` (backend only)

### @ai-sdk/openai (OpenAI Provider for Vercel AI SDK)
- **Purpose**: Provides the `openai()` provider function for Vercel AI SDK to connect to OpenAI models
- **Version**: `^1.0.0` (installed automatically as peer dependency of `ai`)
- **Justification**: Required to use OpenAI models with Vercel AI SDK's `streamText` function
- **Installation**: Installed automatically with `ai` package

**Note**: No additional dependencies are needed. `zod` is already installed in the backend for request validation, and `@tanstack/react-query` is already installed in the frontend for data fetching.
