# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-11-17-recommendation-storage-backend/spec.md

## Important: Two Types of Feedback

This system handles two distinct types of feedback that must not be confused:

1. **Athlete Input Feedback (athleteInputFeedback)**:

   - Free-text provided by users WHEN REQUESTING a recommendation
   - Example: "I felt the long run was too difficult, please reduce intensity"
   - Stored in Recommendation model as `athleteInputFeedback` field
   - Used as INPUT to AI generation to create better recommendations
   - Optional field in recommendation request body as `userFeedback` parameter

2. **Recommendation Evaluation Feedback**:
   - Structured feedback (rating 1-5, wouldFollow boolean, optional comment) provided AFTER receiving a recommendation
   - Stored in separate Feedback model (already implemented)
   - Used to evaluate recommendation quality and effectiveness
   - Links to Recommendation via `recommendationId` field

## Technical Requirements

### Backend Requirements

#### 1. Recommendation Model (apps/api/src/models/Recommendation.ts)

- **File Location**: `apps/api/src/models/Recommendation.ts`
- **Purpose**: Define MongoDB schema for storing AI-generated recommendations
- **Schema Fields**:
  - `userId`: ObjectId reference to User model (required, indexed)
  - `trainingPlanId`: ObjectId reference to TrainingPlan model (required, indexed)
  - `weekNumber`: Number representing training plan week (required, min: 1)
  - `content`: String storing full markdown recommendation text (required, maxLength: 50000)
  - `athleteInputFeedback`: Optional string storing athlete's input when requesting recommendation (maxLength: 1000) - this is the `userFeedback` from the API request
  - `isRegenerated`: Boolean flag indicating if this is a regenerated recommendation (default: false)
  - `previousRecommendationId`: Optional ObjectId reference to original recommendation if regenerated
  - `createdAt`: Timestamp (auto-generated)
  - `updatedAt`: Timestamp (auto-generated)
- **Indexes**:
  - Compound index on `(userId, trainingPlanId, weekNumber, createdAt)` for efficient history queries
  - Single index on `userId` for user-specific queries
  - Single index on `trainingPlanId` for plan-specific queries
  - Single index on `createdAt` for chronological sorting
- **Virtual Fields**: None required
- **Methods**: None required initially

#### 2. Modify Recommendation Generation Endpoint

- **File**: `apps/api/src/routes/recommendations.ts`
- **Endpoint**: `POST /api/recommendations/generate-with-plan`
- **Current Behavior**: Streams recommendation content directly to response without storing
- **Required Changes**:
  1. Accumulate streamed content in memory during generation
  2. After streaming completes, create Recommendation document with accumulated content
  3. Return recommendation ID as custom header `X-Recommendation-Id` during streaming
  4. Handle errors during storage gracefully (log but don't break streaming)
- **Response Format**:
  - Body: Streaming text content (unchanged)
  - Headers: Add `X-Recommendation-Id: <mongodbObjectId>`
- **Error Handling**:
  - If recommendation storage fails, log error but complete streaming
  - Return special error header if storage fails: `X-Storage-Error: true`

#### 3. Recommendation Retrieval Endpoints

**A. Get Single Recommendation**

- **Endpoint**: `GET /api/recommendations/:id`
- **File**: New controller in `apps/api/src/controllers/recommendation.controller.ts`
- **Purpose**: Retrieve individual recommendation by ID with ownership validation
- **Parameters**:
  - `id`: MongoDB ObjectId in URL path
- **Authorization**: JWT required, verify recommendation belongs to authenticated user
- **Response**: Full recommendation object with populated trainingPlan reference (name and currentWeek only)
- **Error Cases**:
  - 400: Invalid recommendation ID format
  - 404: Recommendation not found
  - 403: Recommendation doesn't belong to user

**B. Get User Recommendation History**

- **Endpoint**: `GET /api/recommendations/user/history`
- **File**: Same controller as above
- **Purpose**: Retrieve user's recommendation history with filtering
- **Query Parameters**:
  - `trainingPlanId` (optional): Filter by specific training plan
  - `weekNumber` (optional): Filter by specific week
  - `limit` (optional): Number of results (default: 20, max: 100)
  - `offset` (optional): Pagination offset (default: 0)
- **Authorization**: JWT required
- **Response**: Array of recommendations sorted by createdAt descending
- **Includes**: Count of total recommendations matching filters

#### 4. Frontend Integration Updates

**A. Update useRecommendations Hook**

- **File**: `apps/web/hooks/use-recommendations.ts`
- **Changes Required**:
  1. Add state for storing `recommendationId: string | null`
  2. After streaming completes, read `X-Recommendation-Id` header from response
  3. Store recommendation ID in state
  4. Return recommendation ID in hook return value
  5. Reset recommendation ID when generating new recommendation

**B. Update Dashboard Page**

- **File**: `apps/web/app/dashboard/page.tsx`
- **Changes Required**:
  1. Destructure `recommendationId` from `useRecommendations` hook
  2. Pass actual `recommendationId` to `RecommendationsCard` instead of `activePlan?.id`
  3. Only show feedback button when `recommendationId` is not null

**C. Update RecommendationsCard Component**

- **File**: `apps/web/app/dashboard/components/recommendations/recommendations-card.tsx`
- **Changes Required**:
  1. Update `recommendationId` prop type to `string | null` (instead of optional string)
  2. Only render `FeedbackButton` when `recommendationId` is truthy and not generating
  3. Add prop documentation clarifying this is the MongoDB recommendation ID

#### 5. Add Recommendation Validation to Feedback Endpoint

- **File**: `apps/api/src/controllers/feedback.controller.ts`
- **Function**: `submitFeedback`
- **Current Issue**: The endpoint accepts any valid ObjectId as `recommendationId` without verifying it references an actual Recommendation
- **Required Changes**:
  1. After validating ObjectId format, query Recommendation collection to verify recommendation exists
  2. Verify recommendation belongs to the authenticated user (ownership check)
  3. Return 404 if recommendation doesn't exist
  4. Return 403 if recommendation exists but doesn't belong to user
- **Implementation**:

```typescript
// After existing ObjectId validation
const recommendation = await Recommendation.findById(recommendationId);

if (!recommendation) {
  sendNotFound(res, "Recommendation not found");
  return;
}

if (recommendation.userId.toString() !== userId) {
  sendForbidden(res, "This recommendation does not belong to you");
  return;
}

// Continue with existing duplicate feedback check...
```

### Data Flow Architecture

```
User requests recommendation
        ↓
Frontend: POST /api/recommendations/generate-with-plan
        ↓
Backend: Generate AI recommendation (streaming)
        ↓
Backend: Accumulate content while streaming
        ↓
Backend: Stream completes → Save to MongoDB Recommendation
        ↓
Backend: Include recommendation ID in response header
        ↓
Frontend: Parse X-Recommendation-Id header
        ↓
Frontend: Store recommendation ID in state
        ↓
Frontend: Display recommendation with feedback button
        ↓
User clicks feedback → Frontend sends recommendationId (not planId)
        ↓
Backend: Validate recommendation exists and belongs to user
        ↓
Backend: Save feedback linked to correct recommendation
```

### Performance Considerations

1. **Streaming + Storage**: Accumulating content during streaming adds minimal memory overhead (~50KB typical recommendation)
2. **Index Strategy**: Compound index optimizes common query pattern (user + plan + week + date)
3. **Content Size**: 50KB character limit prevents excessive storage while accommodating detailed recommendations
4. **Query Optimization**: Use projection to exclude `content` field when listing history (return only metadata)

### Error Handling Strategy

1. **Storage Failure During Streaming**: Log error, set error header, but complete streaming to avoid breaking user experience
2. **Invalid Recommendation ID**: Return 400 with clear error message
3. **Authorization Failures**: Return 403 when user tries accessing others' recommendations
4. **Not Found**: Return 404 with helpful message when recommendation doesn't exist

## External Dependencies

No new external dependencies are required. This implementation uses existing packages:

- **mongoose**: Already in use for MongoDB operations
- **express**: Already in use for API routing
- **zod**: Already in use for validation

## Migration Considerations

### Data Migration

- **Not Required**: This is a new feature, no existing data to migrate
- **Backward Compatibility**: Existing feedback documents will have dangling `recommendationId` references (they currently reference training plan IDs incorrectly), but this won't cause issues as the feature wasn't functional before

### Deployment Strategy

1. Deploy backend changes first (recommendation model + storage logic)
2. Verify recommendations are being stored correctly in MongoDB
3. Deploy frontend changes to consume recommendation IDs
4. Monitor for any issues with feedback submission

### Rollback Plan

If issues occur:

1. Frontend can be rolled back independently (will revert to sending training plan IDs)
2. Backend recommendation storage is additive and won't break existing functionality
3. New Recommendation collection can be safely dropped if needed
