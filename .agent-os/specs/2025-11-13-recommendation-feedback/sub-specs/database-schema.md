# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-11-13-recommendation-feedback/spec.md

> Created: 2025-11-13
> Version: 1.0.0

## Schema Changes

### New Collection: `feedbacks`

**Purpose:** Store user feedback on AI-generated training recommendations

**Mongoose Schema Definition:**

```typescript
import mongoose, { Schema, Document } from 'mongoose';

interface IFeedback extends Document {
  recommendationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  usefulnessRating: number;
  wouldFollow: boolean;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const feedbackSchema = new Schema<IFeedback>(
  {
    recommendationId: {
      type: Schema.Types.ObjectId,
      ref: 'Recommendation',
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    usefulnessRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: Number.isInteger,
        message: 'Usefulness rating must be an integer',
      },
    },
    wouldFollow: {
      type: Boolean,
      required: true,
    },
    comment: {
      type: String,
      maxlength: 1000,
      trim: true,
      default: null,
    },
  },
  {
    timestamps: true, // Automatically manages createdAt and updatedAt
    collection: 'feedbacks',
  }
);

// Compound unique index to prevent duplicate feedback
feedbackSchema.index(
  { userId: 1, recommendationId: 1 },
  { unique: true, name: 'unique_user_recommendation_feedback' }
);

// Index for efficient querying by recommendation (for analytics)
feedbackSchema.index(
  { recommendationId: 1, createdAt: -1 },
  { name: 'recommendation_date_index' }
);

// Index for efficient user feedback history queries
feedbackSchema.index(
  { userId: 1, createdAt: -1 },
  { name: 'user_feedback_history_index' }
);

const Feedback = mongoose.model<IFeedback>('Feedback', feedbackSchema);

export default Feedback;
export type { IFeedback };
```

### Field Specifications

| Field Name | Type | Required | Constraints | Description |
|------------|------|----------|-------------|-------------|
| `_id` | ObjectId | Auto | Primary key | Unique identifier for feedback document |
| `recommendationId` | ObjectId | Yes | Reference to `recommendations` collection | Links feedback to specific recommendation |
| `userId` | ObjectId | Yes | Reference to `users` collection | Identifies user who submitted feedback |
| `usefulnessRating` | Number | Yes | Integer, min: 1, max: 5 | User's rating of recommendation usefulness (1-5 stars) |
| `wouldFollow` | Boolean | Yes | - | Whether user intends to follow the recommendation |
| `comment` | String | No | Max length: 1000 chars, trimmed | Optional user comments about recommendation |
| `createdAt` | Date | Auto | Managed by timestamps | Timestamp when feedback was submitted |
| `updatedAt` | Date | Auto | Managed by timestamps | Timestamp when feedback was last modified |

### Indexes

#### 1. Compound Unique Index: `unique_user_recommendation_feedback`

**Fields:** `userId` (ascending), `recommendationId` (ascending)

**Purpose:**
- Enforce uniqueness constraint: one feedback per user per recommendation
- Prevent duplicate feedback submissions at database level
- Efficient duplicate detection queries

**Query Benefits:**
```typescript
// Fast duplicate check before insertion
Feedback.findOne({ userId, recommendationId })
```

#### 2. Compound Index: `recommendation_date_index`

**Fields:** `recommendationId` (ascending), `createdAt` (descending)

**Purpose:**
- Efficient retrieval of all feedback for a specific recommendation
- Support analytics queries for recommendation quality metrics
- Ordered by submission date (newest first)

**Query Benefits:**
```typescript
// Get all feedback for a recommendation, ordered by date
Feedback.find({ recommendationId }).sort({ createdAt: -1 })

// Aggregate feedback stats for a recommendation
Feedback.aggregate([
  { $match: { recommendationId } },
  { $group: {
    _id: null,
    avgRating: { $avg: '$usefulnessRating' },
    totalResponses: { $sum: 1 }
  }}
])
```

#### 3. Compound Index: `user_feedback_history_index`

**Fields:** `userId` (ascending), `createdAt` (descending)

**Purpose:**
- Retrieve user's feedback history efficiently
- Support user profile/activity pages
- Enable user feedback trend analysis

**Query Benefits:**
```typescript
// Get all feedback submitted by a user
Feedback.find({ userId }).sort({ createdAt: -1 })

// Check if user has submitted any feedback recently
Feedback.findOne({ userId }).sort({ createdAt: -1 })
```

### Relationships

#### Parent Collections

1. **`users` Collection**
   - Relationship: Many feedbacks belong to one user
   - Foreign Key: `userId` references `users._id`
   - Cascade Behavior: When user is deleted, optionally cascade delete their feedback or set userId to null (TBD based on data retention policy)

2. **`recommendations` Collection**
   - Relationship: Many feedbacks belong to one recommendation
   - Foreign Key: `recommendationId` references `recommendations._id`
   - Cascade Behavior: When recommendation is deleted, optionally cascade delete associated feedback or keep for historical analytics (TBD based on data retention policy)

#### Referential Integrity

**Validation on Insert:**
```typescript
// Verify recommendation exists before creating feedback
const recommendation = await Recommendation.findById(recommendationId);
if (!recommendation) {
  throw new Error('Recommendation not found');
}

// Verify user exists (typically handled by authentication middleware)
const user = await User.findById(userId);
if (!user) {
  throw new Error('User not found');
}
```

### Data Retention Considerations

**Short-term (v1):**
- Keep all feedback indefinitely for analytics
- No automated deletion policies

**Long-term (Future Consideration):**
- Archive feedback older than 2 years
- Implement soft delete for user data privacy compliance (GDPR)
- Add `deletedAt` timestamp field for soft deletes

## Migrations

### Migration 1: Create Feedbacks Collection

**File:** `migrations/2025-11-13-create-feedbacks-collection.ts`

**Purpose:** Initialize the `feedbacks` collection with proper schema and indexes

**Migration Script:**

```typescript
import mongoose from 'mongoose';
import Feedback from '../models/Feedback';

export const up = async () => {
  console.log('Creating feedbacks collection with indexes...');

  // Create collection (Mongoose will create it on first insert, but we can ensure it exists)
  const collections = await mongoose.connection.db.listCollections().toArray();
  const collectionExists = collections.some(col => col.name === 'feedbacks');

  if (!collectionExists) {
    await mongoose.connection.db.createCollection('feedbacks');
    console.log('Created feedbacks collection');
  } else {
    console.log('Feedbacks collection already exists');
  }

  // Create indexes (Mongoose will handle this via ensureIndexes)
  await Feedback.createIndexes();
  console.log('Created indexes on feedbacks collection');

  // Verify indexes were created
  const indexes = await Feedback.collection.getIndexes();
  console.log('Feedbacks collection indexes:', indexes);

  console.log('Migration completed successfully');
};

export const down = async () => {
  console.log('Rolling back feedbacks collection migration...');

  // Drop collection
  await mongoose.connection.db.dropCollection('feedbacks');
  console.log('Dropped feedbacks collection');

  console.log('Rollback completed successfully');
};
```

**Execution:**
```bash
# Run migration
pnpm run migrate:up

# Rollback migration (if needed)
pnpm run migrate:down
```

### Migration 2: Backfill Validation (If Needed)

**Purpose:** If feedback collection already exists from early development, validate and fix data

**File:** `migrations/2025-11-13-validate-feedbacks-data.ts`

**Migration Script:**

```typescript
import Feedback from '../models/Feedback';

export const up = async () => {
  console.log('Validating existing feedback documents...');

  const feedbacks = await Feedback.find({});
  let invalidCount = 0;
  let fixedCount = 0;

  for (const feedback of feedbacks) {
    let needsUpdate = false;

    // Trim comments if they exist
    if (feedback.comment && feedback.comment !== feedback.comment.trim()) {
      feedback.comment = feedback.comment.trim();
      needsUpdate = true;
    }

    // Validate rating is integer between 1-5
    if (feedback.usefulnessRating < 1 || feedback.usefulnessRating > 5) {
      console.log(`Invalid rating for feedback ${feedback._id}: ${feedback.usefulnessRating}`);
      invalidCount++;
      continue;
    }

    // Validate wouldFollow is boolean
    if (typeof feedback.wouldFollow !== 'boolean') {
      console.log(`Invalid wouldFollow for feedback ${feedback._id}: ${feedback.wouldFollow}`);
      invalidCount++;
      continue;
    }

    if (needsUpdate) {
      await feedback.save();
      fixedCount++;
    }
  }

  console.log(`Validation complete. Fixed: ${fixedCount}, Invalid: ${invalidCount}`);
};

export const down = async () => {
  console.log('No rollback needed for validation migration');
};
```

### Index Creation Monitoring

**Post-Migration Verification:**

```typescript
// Verify indexes in MongoDB shell or via script
import mongoose from 'mongoose';
import Feedback from './models/Feedback';

const verifyIndexes = async () => {
  const indexes = await Feedback.collection.getIndexes();

  const requiredIndexes = [
    'unique_user_recommendation_feedback',
    'recommendation_date_index',
    'user_feedback_history_index',
  ];

  const indexNames = Object.keys(indexes);

  for (const indexName of requiredIndexes) {
    if (indexNames.includes(indexName)) {
      console.log(`✓ Index ${indexName} exists`);
    } else {
      console.log(`✗ Index ${indexName} missing`);
    }
  }
};
```

### Performance Considerations

**Index Size Monitoring:**
- Monitor index size as feedback collection grows
- Indexes should be significantly smaller than total collection size
- If indexes grow too large (> 30% of collection size), review index usage

**Query Performance Targets:**
- Duplicate check query: < 5ms
- Feedback status query: < 10ms
- Aggregation queries (analytics): < 100ms for single recommendation
- User feedback history: < 50ms for pagination (20 results)

**Optimization Strategies (Future):**
- Consider partial indexes if filtering by date ranges
- Archive old feedback to separate collection if query performance degrades
- Implement read replicas for analytics queries
