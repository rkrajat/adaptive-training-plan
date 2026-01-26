# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2026-01-22-strava-activity-sync-api/spec.md

## New Collection: Activity

### Schema Definition

```typescript
interface IActivity extends Document {
  userId: mongoose.Types.ObjectId;      // Reference to User collection
  stravaActivityId: number;             // Strava's activity ID (for deduplication)
  name: string;                         // Activity name from Strava
  type: string;                         // Activity type (Run, Ride, etc.)
  distance: number;                     // Distance in meters
  movingTime: number;                   // Moving time in seconds
  startDate: Date;                      // Activity start timestamp
  averageHeartrate: number | null;      // Average HR (nullable if no HR data)
  syncedAt: Date;                       // When this activity was last synced
  createdAt: Date;                      // Mongoose timestamp
  updatedAt: Date;                      // Mongoose timestamp
}
```

### Mongoose Schema

```typescript
const activitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    stravaActivityId: {
      type: Number,
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    distance: {
      type: Number,
      required: true,
    },
    movingTime: {
      type: Number,
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    averageHeartrate: {
      type: Number,
      default: null,
    },
    syncedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
```

### Indexes

```typescript
// Compound unique index to prevent duplicate activities per user
activitySchema.index({ userId: 1, stravaActivityId: 1 }, { unique: true });

// Query optimization for fetching user activities by date
activitySchema.index({ userId: 1, startDate: -1 });

// TTL index option (alternative to manual deletion)
// Not recommended - using manual deletion for more control
```

### Rationale

- **stravaActivityId**: Stored separately from MongoDB `_id` to enable upsert operations matching Strava's unique identifier
- **syncedAt**: Tracks when the activity was last synced, useful for debugging and audit
- **Compound unique index**: Prevents duplicate activities if sync runs multiple times
- **startDate index**: Optimizes the common query pattern of fetching recent activities sorted by date

---

## User Collection Modification

### New Fields

Add to existing User schema:

```typescript
{
  lastActivitySyncAt: {
    type: Date,
    default: null,
  },
}
```

### Field Purpose

- **lastActivitySyncAt**: Timestamp of the last successful activity sync for this user. Used for:
  - Operational visibility (when was data last refreshed?)
  - Future optimization (only sync users who haven't synced recently)
  - Debugging sync issues

### Migration Notes

- New field is optional with `null` default - no data migration required
- Existing users will have `null` until first sync
