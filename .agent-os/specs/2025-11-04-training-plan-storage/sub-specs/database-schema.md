# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-11-04-training-plan-storage/spec.md

## Schema Overview

Two new Mongoose models will be created:
1. **TrainingPlan** - Stores active training plans for users
2. **TrainingPlanVersion** - Maintains version history of training plan changes

## TrainingPlan Schema

**File:** `apps/api/src/models/TrainingPlan.ts`

### Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| userId | String | Yes | - | Reference to user (Strava ID or MongoDB ObjectId) |
| csvContent | String | Yes | - | Raw CSV training plan content |
| name | String | No | - | User-provided plan name |
| goal | String | No | - | Training goal description |
| raceName | String | No | - | Name of target race |
| raceDate | Date | No | - | Date of target race |
| raceDistance | String | No | - | Race distance (e.g., "5K", "marathon") |
| targetTime | String | No | - | Target finish time (e.g., "3:30:00") |
| source | String (enum) | No | "manual_upload" | Plan source: "manual_upload", "coach_provided", "ai_generated", "other" |
| isActive | Boolean | Yes | true | Whether this is the currently active plan |
| currentWeek | Number | No | 1 | Current week in the training plan |
| startDate | Date | No | - | When user started following this plan |
| createdAt | Date | Auto | now | Document creation timestamp |
| updatedAt | Date | Auto | now | Document last update timestamp |

### Indexes

```javascript
// Compound index for efficient user lookups of active plans
{ userId: 1, isActive: 1 }

// Single field index for user queries
{ userId: 1 }

// Index for active plan queries
{ isActive: 1 }
```

### Schema Definition (Mongoose)

```typescript
import { Schema, model, type Document } from 'mongoose';

export interface ITrainingPlan extends Document {
  userId: string;
  csvContent: string;
  name?: string;
  goal?: string;
  raceName?: string;
  raceDate?: Date;
  raceDistance?: string;
  targetTime?: string;
  source: 'manual_upload' | 'coach_provided' | 'ai_generated' | 'other';
  isActive: boolean;
  currentWeek?: number;
  startDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const trainingPlanSchema = new Schema<ITrainingPlan>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    csvContent: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    goal: {
      type: String,
      trim: true,
    },
    raceName: {
      type: String,
      trim: true,
    },
    raceDate: {
      type: Date,
    },
    raceDistance: {
      type: String,
      trim: true,
    },
    targetTime: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: ['manual_upload', 'coach_provided', 'ai_generated', 'other'],
      default: 'manual_upload',
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    currentWeek: {
      type: Number,
      min: 1,
      default: 1,
    },
    startDate: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
trainingPlanSchema.index({ userId: 1, isActive: 1 });

export const TrainingPlan = model<ITrainingPlan>('TrainingPlan', trainingPlanSchema);
```

## TrainingPlanVersion Schema

**File:** `apps/api/src/models/TrainingPlanVersion.ts`

### Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| trainingPlanId | ObjectId | Yes | - | Reference to parent TrainingPlan document |
| versionNumber | Number | Yes | - | Sequential version number (1, 2, 3, ...) |
| csvContent | String | Yes | - | Snapshot of CSV content at this version |
| name | String | No | - | Snapshot of plan name at this version |
| goal | String | No | - | Snapshot of goal at this version |
| raceName | String | No | - | Snapshot of race name at this version |
| raceDate | Date | No | - | Snapshot of race date at this version |
| raceDistance | String | No | - | Snapshot of race distance at this version |
| targetTime | String | No | - | Snapshot of target time at this version |
| source | String (enum) | No | - | Snapshot of source at this version |
| changeType | String (enum) | Yes | - | Type of change: "created", "updated", "ai_modified" |
| changeDescription | String | No | - | Optional description of what changed |
| createdAt | Date | Auto | now | When this version was created |

### Indexes

```javascript
// Compound index for efficient version history queries
{ trainingPlanId: 1, versionNumber: -1 }

// Single field index for plan lookups
{ trainingPlanId: 1 }

// Index for sorting by creation time
{ createdAt: -1 }
```

### Schema Definition (Mongoose)

```typescript
import { Schema, model, type Document, type Types } from 'mongoose';

export interface ITrainingPlanVersion extends Document {
  trainingPlanId: Types.ObjectId;
  versionNumber: number;
  csvContent: string;
  name?: string;
  goal?: string;
  raceName?: string;
  raceDate?: Date;
  raceDistance?: string;
  targetTime?: string;
  source?: 'manual_upload' | 'coach_provided' | 'ai_generated' | 'other';
  changeType: 'created' | 'updated' | 'ai_modified';
  changeDescription?: string;
  createdAt: Date;
}

const trainingPlanVersionSchema = new Schema<ITrainingPlanVersion>(
  {
    trainingPlanId: {
      type: Schema.Types.ObjectId,
      ref: 'TrainingPlan',
      required: true,
      index: true,
    },
    versionNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    csvContent: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      trim: true,
    },
    goal: {
      type: String,
      trim: true,
    },
    raceName: {
      type: String,
      trim: true,
    },
    raceDate: {
      type: Date,
    },
    raceDistance: {
      type: String,
      trim: true,
    },
    targetTime: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      enum: ['manual_upload', 'coach_provided', 'ai_generated', 'other'],
    },
    changeType: {
      type: String,
      enum: ['created', 'updated', 'ai_modified'],
      required: true,
    },
    changeDescription: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound index for version history queries
trainingPlanVersionSchema.index({ trainingPlanId: 1, versionNumber: -1 });

// Index for time-based queries
trainingPlanVersionSchema.index({ createdAt: -1 });

// Unique constraint: one version number per plan
trainingPlanVersionSchema.index(
  { trainingPlanId: 1, versionNumber: 1 },
  { unique: true }
);

export const TrainingPlanVersion = model<ITrainingPlanVersion>(
  'TrainingPlanVersion',
  trainingPlanVersionSchema
);
```

## Relationships

```
User (existing)
  └── has many → TrainingPlan
                    └── has many → TrainingPlanVersion
```

- One User can have multiple TrainingPlans (historical plans)
- Each TrainingPlan has multiple TrainingPlanVersions (change history)
- Only one TrainingPlan per user should have `isActive: true` at a time

## Data Migration

No migration needed - these are new collections. No existing data to migrate.

## Rationale

### Why Raw CSV Storage?
- **LLM-Friendly**: CSV format is easily consumable by language models without additional processing
- **Simple Integration**: Can pass directly to AI service as string parameter
- **Frontend Flexibility**: Can use CSV parsing libraries in frontend to display as tables
- **Storage Efficiency**: Text storage is compact and doesn't require complex nested objects

### Why Separate Version Collection?
- **Scalability**: Version history can grow large; separate collection prevents bloating main documents
- **Query Performance**: Indexed version queries don't impact main plan queries
- **Data Integrity**: Immutable version records with foreign key constraints
- **Future Features**: Easy to implement rollback, diff views, and audit trails

### Why Both userId Index Types?
- **Single field index** (`userId: 1`): Fast queries for all user plans
- **Compound index** (`userId: 1, isActive: 1`): Optimized for most common query - getting active plan
- MongoDB can use compound index for single-field queries on prefix, but explicit index helps other patterns

### Why Track currentWeek and startDate?
- **Future Feature**: Enables "smart" recommendations based on where user is in their plan
- **Analytics**: Track user progression and adherence to plan timeline
- **Week-Specific Recommendations**: AI can provide advice relevant to current training phase
