# OpenTelemetry Instrumentation with Honeycomb

## Overview

The Adaptive Training Plan app uses OpenTelemetry for unified observability and product metrics, with Honeycomb as the backend (free tier: 20M events/month).

**Why OTel + Honeycomb over pure product analytics (PostHog/Mixpanel)**:
- Single instrumentation for both performance AND user behavior
- Future-proof: can switch backends without re-instrumenting
- Honeycomb's query interface handles both trace analysis and metric aggregations
- Distributed tracing across frontend → API → external services (Strava, AI)

---

## Architecture

### Separation of Concerns

**Frontend (Next.js)**: User intent and interaction tracking
- UI clicks, navigation, modal opens
- User decisions (accept/reject)

**Backend (Express API)**: Business transactions
- AI recommendation generation
- File processing (training plan uploads)
- Database operations

This separation allows clear analysis:
- Frontend events answer "what did the user do?"
- Backend events answer "what did the system do?"

---

## Configuration

### Backend Environment Variables

**File**: `apps/api/.env`

```bash
# OpenTelemetry / Honeycomb Configuration (optional)
# Get your API key from https://ui.honeycomb.io/account
# Leave empty to disable telemetry
HONEYCOMB_API_KEY=your-honeycomb-api-key
OTEL_SERVICE_NAME=adaptive-training-api
```

### Frontend Environment Variables

**File**: `apps/web/.env.local`

```bash
# OpenTelemetry / Honeycomb Configuration (optional)
# Get an ingest-only API key from https://ui.honeycomb.io/account
# IMPORTANT: Use an ingest-only key for browser-side telemetry (safe to expose)
# Leave empty to disable telemetry
NEXT_PUBLIC_HONEYCOMB_API_KEY=your-honeycomb-ingest-only-api-key
NEXT_PUBLIC_OTEL_SERVICE_NAME=adaptive-training-web

# App Version (optional, used in telemetry)
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### Honeycomb Setup

1. Create Honeycomb account (free tier)
2. Create environment for the project
3. Generate API keys:
   - Full API key for backend
   - Ingest-only key for frontend (browser-safe)
4. Datasets are auto-created on first trace

---

## Implementation Files

### Backend (`apps/api`)

| File | Purpose |
|------|---------|
| `src/instrumentation.ts` | OTel SDK initialization (imported first in index.ts) |
| `src/telemetry/constants.ts` | Event names and tracer name constants |
| `src/telemetry/utils.ts` | `withSpan` and `recordEvent` utilities |
| `src/telemetry/index.ts` | Barrel exports |
| `src/middleware/telemetry.middleware.ts` | Enriches spans with user context and route metadata |

### Frontend (`apps/web`)

| File | Purpose |
|------|---------|
| `lib/telemetry/init.ts` | OTel SDK initialization for browser |
| `lib/telemetry/constants.ts` | Event names constants |
| `lib/telemetry/track-event.ts` | `trackEvent` and `trackAsyncEvent` utilities |
| `lib/telemetry/TelemetryProvider.tsx` | React provider component |
| `lib/telemetry/index.ts` | Barrel exports |

---

## Tracked Events

### Backend Events

| Event Name | Location | Attributes | Description |
|------------|----------|------------|-------------|
| `recommendation.generate` | `src/routes/recommendations.ts` | `user.id`, `week_number`, `training_plan.id`, `is_regenerated`, `has_user_feedback`, `experience_level` | Tracks AI recommendation generation with full context |
| `feedback.submit` | `src/controllers/feedback.controller.ts` | `user.id`, `recommendation.id`, `rating`, `would_follow`, `has_comment` | Tracks feedback submission with rating details |
| `training_plan.upload` | `src/routes/training-plans.ts` | `user.id`, `file_type`, `file_size_bytes` | Tracks training plan uploads (CSV/PDF) |

### Frontend Events

Events are consolidated for better Honeycomb analysis. Related outcomes use a single event name with distinguishing attributes (e.g., `action: "accept" | "reject"`) to enable simple `GROUP BY` queries.

| Event Name | Location | Attributes | Description |
|------------|----------|------------|-------------|
| `auth.callback` | `app/auth/callback/page.tsx` | `status` ("success" \| "error"), `error_type` (on error) | Tracks OAuth callback completion |
| `onboarding.step_view` | `app/onboarding/page.tsx` | `step_number`, `step_name` | Tracks each onboarding step view |
| `onboarding.step_complete` | `app/onboarding/page.tsx` | `step_number`, `step_name`, + step-specific attrs | Tracks completion of each onboarding step |
| `onboarding.skip` | `app/onboarding/page.tsx` | `skipped_at_step`, `step_name` | Tracks when user skips onboarding |
| `recommendation.action` | `app/dashboard/components/recommendations/accept-reject-buttons.tsx` | `action` ("accept" \| "reject") | Tracks recommendation accept/reject clicks |
| `recommendation.reject_action_selected` | `app/dashboard/components/recommendations/reject-dialog.tsx` | `action` | Tracks which reject action was chosen |
| `feedback.modal_open` | `app/dashboard/components/feedback/feedback-modal.tsx` | - | Tracks when feedback modal is opened |
| `feedback.submit_click` | `app/dashboard/components/feedback/feedback-modal.tsx` | `rating`, `would_follow`, `has_comment` | Tracks feedback form submission |

### Auto-Instrumented Events

The following are automatically traced by OpenTelemetry instrumentation:

**Backend (via `@opentelemetry/auto-instrumentations-node`):**
- HTTP requests to Express routes
- MongoDB queries
- Outbound HTTP calls (Strava API, OpenAI API)

**Frontend (via `@honeycombio/opentelemetry-web`):**
- All fetch calls to the API server
- Trace context propagation to backend

---

## Telemetry Context Middleware

All authenticated API requests are enriched with:

| Attribute | Description |
|-----------|-------------|
| `user.id` | MongoDB user ID |
| `user.strava_id` | Strava athlete ID |
| `http.route` | Express route pattern (e.g., `/api/recommendations/:id`) |
| `http.method` | HTTP method |
| `http.target` | Request path |

This middleware is wired after `authenticateJWT` on all protected routes.

---

## Honeycomb Queries

### Example Queries

**Recommendation Accept/Reject Rate:**
```
WHERE name = "recommendation.action"
GROUP BY action
```

**Auth Success vs Error:**
```
WHERE name = "auth.callback"
GROUP BY status
```

**Onboarding Funnel:**
```
WHERE name CONTAINS "onboarding.step"
GROUP BY attributes["step_number"]
```

**Recommendation Generation Time:**
```
WHERE name = "recommendation.generate"
VISUALIZE AVG(duration_ms)
```

**Feedback Ratings Distribution:**
```
WHERE name = "feedback.submit"
HEATMAP(attributes["rating"])
```

---

## Graceful Degradation

Telemetry is completely optional:
- **Backend**: When `HONEYCOMB_API_KEY` is not set, telemetry is disabled and the app runs without any observability
- **Frontend**: When `NEXT_PUBLIC_HONEYCOMB_API_KEY` is not set, telemetry is disabled

No errors or warnings are thrown when telemetry is disabled.

---

## Dependencies

### Backend
```json
{
  "@opentelemetry/api": "^1.x",
  "@opentelemetry/sdk-node": "^0.x",
  "@opentelemetry/auto-instrumentations-node": "^0.x",
  "@honeycombio/opentelemetry-node": "^0.x"
}
```

### Frontend
```json
{
  "@opentelemetry/api": "^1.x",
  "@honeycombio/opentelemetry-web": "^0.x"
}
```

---

## Notes

- **Free Tier Limits**: Honeycomb free tier is 20M events/month. Monitor usage in Honeycomb UI.
- **Sampling**: If approaching limits, add sampling (e.g., sample 50% of less-critical spans)
- **PII**: Avoid adding PII to span attributes. Use anonymized user IDs only.
- **Browser Key Security**: Frontend API key is exposed to users - ensure it's ingest-only with no read permissions.
