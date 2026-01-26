# Spec Requirements Document

> Spec: Strava Activity Sync API
> Created: 2026-01-22

## Overview

Implement an on-demand API endpoint that syncs Strava activities for all registered users and stores them in a local database, enabling fast activity retrieval from the database instead of real-time Strava API calls. This reduces Strava API dependency, improves UI performance, and provides a foundation for background data processing.

## User Stories

### Bulk Activity Sync for Platform Operations

As a platform administrator, I want to trigger a bulk sync of all users' Strava activities via an API call, so that the platform has up-to-date activity data stored locally for fast retrieval.

When the sync endpoint is called, the system iterates through all users with valid Strava credentials, fetches their last 30 days of activities from Strava, and stores/updates them in the local database. Users with expired tokens have their tokens automatically refreshed. The endpoint returns a summary of sync results including successes, failures, and any errors encountered.

### Fast Activity Loading for End Users

As a runner using the platform, I want my activities to load instantly from the local database, so that I don't have to wait for Strava API calls every time I view my training data.

When I navigate to my activities page, the UI fetches activities from the local database instead of calling Strava directly. This provides a consistently fast experience regardless of Strava API availability or rate limits.

## Spec Scope

1. **Activity Sync API Endpoint** - POST endpoint that triggers sync for all users with Strava credentials, handling token refresh and error recovery
2. **Activity Storage Model** - MongoDB schema to store synced activities with user association and sync metadata
3. **User Sync Tracking** - Track last sync timestamp and sync status per user for operational visibility
4. **Database Activity Retrieval** - Update existing activity routes to fetch from local database instead of Strava API
5. **30-Day Rolling Window** - Automatically remove activities older than 30 days during sync to maintain data freshness

## Out of Scope

- Scheduled/cron-based automatic syncing (manual trigger only)
- Real-time webhook integration with Strava for immediate activity sync
- Syncing activities for a single specific user (bulk sync only)
- Historical data beyond 30 days
- Activity detail pages with extended metrics (only storing summary data)

## Expected Deliverable

1. POST `/api/activities/sync` endpoint that syncs all users' activities and returns a summary report (users synced, failures, total activities)
2. Activities are stored in MongoDB and the existing GET `/api/activities` endpoint retrieves from database instead of Strava API
3. Expired Strava tokens are automatically refreshed during sync using existing token refresh logic
