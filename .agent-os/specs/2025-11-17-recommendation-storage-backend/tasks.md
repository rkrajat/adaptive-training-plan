# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-11-17-recommendation-storage-backend/spec.md

> Created: 2025-11-17
> Status: Ready for Implementation

## Tasks

### Task 1: Database Layer - Recommendation Model

Create a MongoDB model to persist AI-generated training recommendations with proper schema validation and indexes.

- [ ] 1.2 Create `apps/api/src/models/Recommendation.ts` with Mongoose schema
- [ ] 1.3 Define IRecommendation interface with all required fields (userId, weekNumber, content, metadata, isArchived, timestamps)
- [ ] 1.4 Add schema validation rules (required fields, min/max values, enum constraints)
- [ ] 1.5 Create compound index on (userId, weekNumber, createdAt) for efficient queries
- [ ] 1.6 Add virtual fields for week date range calculation if needed
- [ ] 1.7 Export model and interface from models/index.ts

### Task 2: Backend - Store Recommendations on Generation

Modify the recommendation generation endpoint to persist recommendations to the database and return the recommendation ID.

- [ ] 2.2 Update `apps/api/src/controllers/recommendationsController.ts` to import Recommendation model
- [ ] 2.3 Modify generateRecommendation to accumulate streamed content chunks into complete text
- [ ] 2.4 After streaming completes, create Recommendation document with userId, weekNumber, content, and metadata
- [ ] 2.5 Capture generation metadata (model, timestamp, inputSummary) in document
- [ ] 2.6 Return recommendation ID in X-Recommendation-Id response header
- [ ] 2.7 Add error handling for DB save failures (log error, still return recommendation text)

### Task 3: Backend - Recommendation Retrieval Endpoints

Create endpoints to retrieve individual recommendations and recommendation history for tracking and reference.

- [ ] 3.2 Create getRecommendationById controller function in recommendationsController.ts
- [ ] 3.3 Implement authorization check (verify userId matches authenticated user)
- [ ] 3.4 Add 404 handling for non-existent recommendations
- [ ] 3.5 Create getRecommendationHistory controller function (query by userId, sort by createdAt desc)
- [ ] 3.6 Add pagination support (limit, offset) to history endpoint with default limit of 20
- [ ] 3.7 Register new routes in `apps/api/src/routes/recommendations.ts`
- [ ] 3.8 Run integration tests and verify retrieval endpoints work with proper authorization

### Task 4: Backend - Add Validation to Feedback Endpoint

Enhance the feedback submission endpoint to validate that the recommendation exists and belongs to the user.

- [ ] 4.2 Update submitFeedback controller in recommendationsController.ts
- [ ] 4.3 Add recommendationId validation (check if valid ObjectId format)
- [ ] 4.4 Query Recommendation model to verify recommendation exists
- [ ] 4.5 Verify recommendation belongs to authenticated user (userId match)
- [ ] 4.6 Return 404 if recommendation not found
- [ ] 4.7 Return 403 if recommendation belongs to different user

### Task 5: Frontend - Capture and Use Recommendation IDs

Update frontend code to capture recommendation IDs from generation response and pass them to feedback submission.

- [ ] 5.2 Update `apps/web/src/hooks/useRecommendations.ts` mutation to extract X-Recommendation-Id from response headers
- [ ] 5.3 Store recommendation ID in mutation result data structure
- [ ] 5.4 Update recommendation state type to include optional recommendationId field
- [ ] 5.5 Modify `apps/web/src/app/dashboard/page.tsx` to pass recommendation ID to RecommendationsCard
- [ ] 5.6 Update `apps/web/src/components/recommendations/RecommendationsCard.tsx` to accept recommendationId prop
- [ ] 5.7 Pass recommendationId to feedback submission mutation in RecommendationsCard

## Success Criteria

- All recommendations are persisted to MongoDB with complete metadata
- Recommendation IDs are returned to frontend via response headers
- Frontend captures and uses recommendation IDs for feedback submission
- Feedback endpoint validates recommendation existence and ownership
- No breaking changes to existing functionality
