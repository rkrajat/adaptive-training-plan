# Spec Requirements Document

> Spec: Vercel AI SDK Integration for AI-Powered Run Summaries
> Created: 2025-10-30

## Overview

Integrate Vercel AI SDK with OpenAI GPT-4o-mini to replace hardcoded training recommendations on the dashboard with AI-generated summaries based on the user's past month of Strava running data. This feature will analyze activities (distance, heart rate, pace) and provide personalized weekly training recommendations with streaming responses for better user experience.

## User Stories

### AI-Generated Training Recommendations

As a runner viewing my dashboard, I want to see an AI-generated analysis of my recent training performance and receive personalized weekly recommendations, so that I can optimize my training plan based on actual performance data rather than generic advice.

**Detailed Workflow:**
1. User logs in and navigates to the dashboard
2. Dashboard automatically fetches the user's Strava activities from the past 30 days
3. The system sends this activity data to the AI endpoint, which uses Vercel AI SDK to stream a response from OpenAI
4. The AI analyzes running patterns (distance, pace, heart rate) and generates:
   - A performance analysis paragraph summarizing recent training
   - 4 specific recommended adjustments for the upcoming week
5. Recommendations stream into the UI in real-time, replacing the hardcoded placeholder content
6. User can read the personalized analysis and apply suggestions to their training plan

### Regenerate Recommendations

As a runner who wants a fresh perspective, I want to regenerate my training recommendations, so that I can get alternative suggestions or updated analysis based on the same data.

**Detailed Workflow:**
1. User views the current AI-generated recommendations on the dashboard
2. User clicks the "Regenerate" button (currently non-functional)
3. System re-sends the activity data to the AI endpoint with a regeneration flag
4. New recommendations stream into the UI, replacing the previous content
5. User sees fresh recommendations that may offer different insights or emphasis

### Graceful Error Handling

As a runner using the platform, I want to see helpful error messages if the AI summary fails to generate, so that I understand what went wrong and can take appropriate action.

**Detailed Workflow:**
1. If the OpenAI API key is invalid, rate limit is exceeded, or network issues occur
2. User sees a friendly error message explaining the issue
3. Dashboard shows a fallback state (loading indicator or error card)
4. User can retry by clicking the "Regenerate" button once the issue is resolved

## Spec Scope

1. **Backend Package Installation** - Add Vercel AI SDK (`ai`) and OpenAI SDK (`openai`) packages to the backend API using pnpm
2. **Environment Configuration** - Add `OPENAI_API_KEY` environment variable to backend `.env` file with clear documentation
3. **Backend Streaming Endpoint** - Create new route `/api/recommendations/generate` that accepts activity data, constructs an LLM prompt, and streams AI-generated recommendations using Vercel AI SDK's `streamText` function
4. **Frontend Package Installation** - Add Vercel AI SDK React package (`ai`) to the web frontend using pnpm for streaming hooks
5. **Frontend Integration** - Replace hardcoded recommendation content in the dashboard with AI-streamed content using TanStack Query mutation and real-time UI updates
6. **Regenerate Functionality** - Wire up the existing "Regenerate" button to trigger a new AI generation request
7. **Loading and Error States** - Implement proper loading indicators during streaming and user-friendly error messages for API failures
8. **Authentication Integration** - Ensure the AI endpoint is protected by JWT authentication middleware, consistent with existing API routes

## Out of Scope

- Storing AI-generated recommendations in MongoDB (future enhancement)
- Allowing users to edit or customize the AI prompt
- Multi-model support (Anthropic Claude, other LLMs) - only OpenAI GPT-4o-mini for v1
- Training plan upload/definition integration (separate feature)
- Mobile-optimized streaming UI (desktop-first approach)
- Rate limiting for AI endpoint (rely on OpenAI's rate limits for now)
- Caching AI responses to reduce API costs (future optimization)

## Expected Deliverable

1. **Working AI Summary on Dashboard** - When a logged-in user visits the dashboard, they see a dynamically generated AI summary based on their Strava data, streaming in real-time, replacing all hardcoded recommendation content
2. **Functional Regenerate Button** - Clicking the "Regenerate" button triggers a new AI generation request and streams fresh recommendations into the UI without page refresh
3. **Proper Error Handling** - If the AI generation fails due to API errors, rate limits, or network issues, the user sees a clear error message with guidance on next steps, and the dashboard remains functional
