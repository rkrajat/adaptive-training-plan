# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2026-01-21-recommendation-acceptance/spec.md

## Technical Requirements

### Database Schema Changes

Update the existing `Recommendation` model with:

- `status` field: enum ('pending', 'accepted', 'rejected', 'expired'), default 'pending', indexed
- `acceptedAt` field: Date, nullable, set when user accepts
- `rejectedAt` field: Date, nullable, set when user rejects
- `expiresAt` field: Date, nullable, indexed, set to Sunday 23:59:59 UTC of target week when accepted

New compound index: `{ userId: 1, status: 1, expiresAt: 1 }` for efficient active recommendation queries

### Backend API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/recommendations/active` | Retrieve user's current active accepted recommendation (if not expired) |
| POST | `/api/recommendations/:id/accept` | Accept a recommendation, set expiry, reject any previous active. Checks cache if not in DB. |
| POST | `/api/recommendations/accept-pending` | Accept a cached recommendation (no DB ID yet). Creates DB record and accepts. |
| POST | `/api/recommendations/:id/reject` | Reject a recommendation with action ('generate_new' or 'discard'). Invalidates cache if action is 'generate_new'. |

### Expiry Calculation Logic

- Expiry day of week configurable via `RECOMMENDATION_EXPIRY_DAY_OF_WEEK` env var (default: 0 = Sunday)
- Calculate days until next expiry day from current date
- Set time to 23:59:59.999 UTC
- Backend validates staleness on each `/active` request

### Frontend Components

- `AcceptRejectButtons` - Accept/Reject button pair with loading states
- `RejectDialog` - Dialog with "Generate New" and "Discard" options
- `ReplaceConfirmationDialog` - Warning when replacing active recommendation

### State Management

- TanStack Query for active recommendation state with 30-second stale time
- Query key: `['recommendations', 'active']`
- Mutations for accept/reject with automatic query invalidation
- Toast notifications for success/error feedback

### UI/UX Specifications

- Accept button: Green-tinted outline button with checkmark icon
- Reject button: Red-tinted outline button with X icon
- Buttons placed next to "Give Feedback" button in recommendations card header
- Buttons only visible for 'pending' status recommendations
- Loading spinners during mutation operations

### Cache Integration

- Recommendations are cached in memory before being saved to database
- Accept flow checks cache if recommendation not found in DB, creates DB record from cache
- Reject with "generate_new" action invalidates cache to allow fresh generation
- Cache is invalidated after successful acceptance
- Cache key format: `recommendation:${userId}:${planId}:${weekNumber}`

### Error Handling

- Validate recommendation ownership before accept/reject
- Prevent accepting non-pending recommendations
- Handle concurrent accept requests gracefully (only one active per user)
- Display user-friendly error messages via toast notifications
- Gracefully handle cache misses (generate new recommendation if needed)

## Environment Configuration

```bash
# Day of week when recommendations expire (0=Sunday through 6=Saturday)
RECOMMENDATION_EXPIRY_DAY_OF_WEEK=0
```
