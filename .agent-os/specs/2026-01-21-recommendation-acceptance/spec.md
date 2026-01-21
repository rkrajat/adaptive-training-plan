# Spec Requirements Document

> Spec: Recommendation Acceptance
> Created: 2026-01-21

## Overview

Implement accept/reject functionality for AI-generated training recommendations, allowing users to persist accepted recommendations for future visits until they expire at the end of the target training week. This feature improves user engagement by letting runners commit to recommendations and track their active training guidance.

## User Stories

### Accepting a Recommendation

As a runner, I want to accept a training recommendation, so that I can see the same recommendation when I return to the app without regenerating.

When I generate a recommendation and find it suitable, I click the "Accept" button next to "Give Feedback". The system saves my acceptance and shows me the recommendation whenever I return to the dashboard until it expires at the end of the training week.

### Rejecting a Recommendation

As a runner, I want to reject a training recommendation, so that I can either get a new one or start fresh.

When I generate a recommendation but don't want to follow it, I click the "Reject" button. A dialog appears asking what I'd like to do next - either "Generate New Recommendation" to get a fresh one, or "Discard" to return to an empty state where I can manually request a new recommendation later.

### Returning with an Active Recommendation

As a runner, I want to see my accepted recommendation when I return to the app, so that I don't lose my training guidance between sessions.

When I return to the dashboard after accepting a recommendation, I see the same recommendation content displayed (as long as it hasn't expired). If the recommendation has expired, I see the standard "Get Recommendations" button to generate a new one.

## Spec Scope

1. **Accept/Reject Buttons** - Add Accept and Reject buttons next to the "Give Feedback" button in the recommendations card
2. **Recommendation Persistence** - Store accepted recommendations with expiry dates and retrieve them on user return
3. **Rejection Flow** - Implement dialog with options to generate new recommendation or discard current one
4. **Expiry Logic** - Calculate and enforce recommendation expiry based on end of target training week (configurable)
5. **Replace Confirmation** - Show confirmation dialog when user tries to generate new recommendation while having an active one

## Out of Scope

- Multiple concurrent accepted recommendations per user
- Custom expiry date selection by user
- Recommendation history/archive viewing
- Sharing recommendations with other users
- Email/push notifications for expiring recommendations
- Partial acceptance (accepting only parts of a recommendation)

## Expected Deliverable

1. User can accept a recommendation and see it persisted across page refreshes and return visits until expiry
2. User can reject a recommendation and choose between generating a new one or discarding to empty state
3. User sees confirmation dialog when attempting to replace an active accepted recommendation
