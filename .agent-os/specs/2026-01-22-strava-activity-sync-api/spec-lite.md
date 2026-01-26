# Spec Summary (Lite)

Implement an on-demand API endpoint (POST `/api/activities/sync`) that bulk-syncs Strava activities for all registered users into a local MongoDB collection, maintaining a 30-day rolling window. Update existing activity routes to read from the database instead of calling Strava API directly, enabling faster UI load times and reduced external API dependency.
