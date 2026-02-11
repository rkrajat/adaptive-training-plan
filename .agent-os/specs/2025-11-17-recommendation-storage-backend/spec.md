# Spec Requirements Document

> Spec: Recommendation Storage Backend
> Created: 2025-11-17

## Overview

Implement backend persistence for AI-generated training recommendations to enable proper feedback tracking and recommendation history. Recommendations are now auto-generated server-side and cached in memory, then saved to the database only when the user explicitly accepts them. This improves performance by avoiding unnecessary database writes and allows users to preview recommendations before committing to them.

**Important Context**: The system has two distinct types of feedback:
1. **Athlete Input Feedback (userFeedback)**: Free-text provided by users WHEN REQUESTING a recommendation (e.g., "I felt the long run was too difficult"). This is INPUT to the AI generation process to create better recommendations.
2. **Recommendation Evaluation Feedback**: Structured feedback (rating, wouldFollow, comment) provided AFTER receiving a recommendation. This is stored in the existing Feedback model and is used to evaluate recommendation quality.

## User Stories

### User Story 1: Storing Generated Recommendations

**As a** backend system, I want to persist each generated recommendation with its content, metadata, and associated training plan, so that recommendations can be referenced for feedback collection, history tracking, and future analysis.

**Workflow:**
1. User loads dashboard with active training plan
2. Backend automatically checks in-memory cache for existing recommendation (keyed by userId, planId, weekNumber)
3. If cache miss, backend generates AI recommendation content via streaming, incorporating any athlete input feedback if provided
4. Generated recommendation is stored in in-memory cache (NOT in database) with TTL (default: 1 hour)
5. Frontend pre-generates recommendation via `GET /api/recommendations/pre-generate` endpoint
6. When user accepts the recommendation, backend creates Recommendation document in MongoDB with:
   - Full recommendation text/markdown content (from cache)
   - Associated userId and trainingPlanId
   - Week number from training plan
   - Athlete input feedback (if user provided input when requesting the recommendation)
   - Generation timestamp
7. Cache entry is invalidated after saving to database
8. Recommendation ID is stored in frontend state for later evaluation feedback submission

### User Story 2: Linking Feedback to Stored Recommendations

**As a** user providing feedback, I want my feedback to be linked to the specific recommendation I received, so that the system can accurately track which recommendations were helpful and correlate feedback with recommendation characteristics.

**Workflow:**
1. User views a generated recommendation with its unique recommendation ID
2. User clicks "Give Feedback" button to open the evaluation feedback modal
3. User provides structured evaluation feedback (rating 1-5, wouldFollow yes/no, optional comment)
4. Frontend sends evaluation feedback to existing POST `/api/feedback` endpoint with the actual recommendation ID (not training plan ID)
5. Backend validates recommendation exists and belongs to the user
6. Backend creates Feedback document (using existing Feedback model) linked to the Recommendation document via recommendationId
7. System can now query all evaluation feedback for a specific recommendation
8. System can analyze recommendation effectiveness patterns by correlating stored recommendations with their evaluation feedback

### User Story 3: Recommendation History and Regeneration

**As a** user, I want the system to track my recommendation history, so that I can see previous recommendations and the system can learn from past interactions when generating new ones.

**Workflow:**
1. User generates initial recommendation for current week
2. System stores recommendation with week number and timestamp
3. User optionally provides evaluation feedback via existing feedback modal (rating, wouldFollow, comment)
4. User requests regeneration with additional athlete input context (e.g., "make it easier")
5. System generates new recommendation incorporating athlete input and stores it with the input text
6. System marks new recommendation as regenerated and links it to original via previousRecommendationId
7. User can view history of all recommendations for the same week (including both original and regenerated)
8. System can analyze regeneration patterns and athlete input requests to improve future recommendations

## Spec Scope

1. **Recommendation Model**: Create MongoDB Recommendation model with schema including content, userId, trainingPlanId, weekNumber, athleteInputFeedback (optional text provided when requesting recommendation), isRegenerated, previousRecommendationId, timestamps, and indexes
2. **Store Recommendations on Generation**: Modify `/api/recommendations/generate-with-plan` endpoint to persist recommendations after streaming completes and return recommendation ID to frontend via response header
3. **Return Recommendation ID**: Add `X-Recommendation-Id` response header containing the MongoDB ObjectId of the stored recommendation so frontend can track and reference it
4. **Recommendation Retrieval Endpoint**: Create GET `/api/recommendations/:id` endpoint to fetch individual recommendation details with ownership validation
5. **User Recommendations History**: Create GET `/api/recommendations/user/history` endpoint to retrieve user's past recommendations with optional filtering by training plan and week
6. **Update Frontend State**: Modify frontend `use-recommendations` hook to capture recommendation ID from response header and store it for evaluation feedback submission
7. **Validate Recommendation Exists**: Add validation in existing POST `/api/feedback` endpoint to verify the recommendationId references an actual Recommendation document that belongs to the user (currently it accepts any ObjectId)

## Out of Scope

1. **Recommendation Analytics Dashboard**: Admin interface for viewing recommendation effectiveness metrics
2. **Recommendation Editing**: Ability to edit or modify stored recommendations after generation
3. **Recommendation Versioning**: Tracking multiple versions of the same recommendation with diff comparison
4. **Recommendation Sharing**: Social features to share recommendations with coaches or other users
5. **Recommendation Templates**: Pre-built recommendation templates based on common training scenarios
6. **Multi-language Support**: Storing and serving recommendations in multiple languages
7. **Recommendation Archiving**: Automatic archival of old recommendations for storage optimization
8. **AI Model Feedback Loop**: Automatic retraining of AI model based on recommendation feedback

## Expected Deliverable

1. **Complete Recommendation Persistence**: Every AI-generated recommendation is automatically saved to MongoDB with complete metadata (content, user, training plan, week, timestamp) and a unique ID is returned to the frontend for reference
2. **Functional Feedback Linking**: User feedback submissions correctly reference stored recommendation IDs instead of training plan IDs, enabling accurate tracking of which specific recommendations received which feedback
3. **Recommendation History Access**: Users and the system can query past recommendations by user, training plan, or week number through new API endpoints, enabling recommendation history viewing and analysis of recommendation patterns over time
