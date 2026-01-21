# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2026-01-21-recommendation-acceptance/spec.md

## Schema Changes

### Recommendation Model Updates

Add the following fields to the existing `Recommendation` Mongoose schema in `apps/api/src/models/Recommendation.ts`:

```typescript
// New type definition
export type RecommendationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

// New fields to add to schema
status: {
  type: String,
  enum: ['pending', 'accepted', 'rejected', 'expired'],
  default: 'pending',
  index: true,
},
acceptedAt: {
  type: Date,
  default: null,
},
rejectedAt: {
  type: Date,
  default: null,
},
expiresAt: {
  type: Date,
  default: null,
  index: true,
},
```

### New Indexes

```typescript
// Compound index for efficient active recommendation queries
recommendationSchema.index(
  { userId: 1, status: 1, expiresAt: 1 },
  { name: 'user_active_recommendation_index' }
);
```

## Rationale

### Why extend existing model vs. new collection

1. **Referential Integrity**: Existing `Feedback` model references `Recommendation` by ID. Creating a separate `AcceptedRecommendation` collection would break this relationship.

2. **Single Source of Truth**: All recommendation data (content, status, feedback) stays in one collection, simplifying queries and reducing data duplication.

3. **History Preservation**: Keeping status in the same model allows tracking recommendation lifecycle (generated → accepted/rejected → expired) for future analytics.

4. **Query Simplicity**: Finding active recommendations is a single query with compound index rather than a join operation.

### Field Design Decisions

- **status**: Using enum string vs. boolean flags allows clean state transitions and easier debugging
- **acceptedAt/rejectedAt**: Separate timestamps allow tracking when actions occurred independently
- **expiresAt**: Stored as absolute date rather than duration for efficient range queries and no computation on read

### Index Strategy

- **Single field index on status**: Supports filtering by status across all users
- **Single field index on expiresAt**: Supports batch jobs to mark expired recommendations
- **Compound index (userId, status, expiresAt)**: Optimizes the primary query pattern - finding a user's active non-expired recommendation

## Migration Considerations

- New fields have defaults, so existing documents remain valid
- No data migration required - existing recommendations will have `status: 'pending'` by default
- Consider backfilling `status` to 'expired' for old recommendations if needed for analytics
