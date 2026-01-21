# Spec Tasks

## Tasks

- [x] 1. Update Recommendation Model and Database Schema
  - [x] 1.1 Add RecommendationStatus type and new fields (status, acceptedAt, rejectedAt, expiresAt) to Recommendation model
  - [x] 1.2 Add compound index for efficient active recommendation queries
  - [x] 1.3 Add RECOMMENDATION_EXPIRY_DAY_OF_WEEK to config schema and env vars
  - [x] 1.4 Verify model changes compile and app starts successfully

- [x] 2. Implement Backend Recommendation Acceptance Service
  - [x] 2.1 Create recommendation-acceptance.service.ts with calculateExpiryDate, isRecommendationStale, getActiveRecommendation, acceptRecommendation, rejectRecommendation functions
  - [x] 2.2 Create recommendation-acceptance.validator.ts with Zod schemas for reject request

- [x] 3. Implement Backend API Endpoints
  - [x] 3.1 Add acceptRecommendation controller function with ownership validation
  - [x] 3.2 Add rejectRecommendation controller function with action handling
  - [x] 3.3 Add getActiveRecommendation controller function
  - [x] 3.4 Register routes: GET /active, POST /:id/accept, POST /:id/reject

- [x] 4. Implement Frontend API Layer and Hooks
  - [x] 4.1 Create types.ts with RecommendationStatus and response interfaces
  - [x] 4.2 Add getActive, accept, and reject methods to recommendationsApi in lib/api.ts
  - [x] 4.3 Create use-recommendation-acceptance.ts hook with useActiveRecommendation, useAcceptRecommendation, useRejectRecommendation

- [x] 5. Implement Frontend UI Components
  - [x] 5.1 Create AcceptRejectButtons component with loading states and styling
  - [x] 5.2 Create RejectDialog component with "Generate New" and "Discard" options
  - [x] 5.3 Create ReplaceConfirmationDialog component for warning when replacing active
  - [x] 5.4 Update RecommendationsCard to include AcceptRejectButtons for pending recommendations
  - [x] 5.5 Update dashboard page to fetch and display active recommendation on load
  - [x] 5.6 Update dashboard page to show ReplaceConfirmationDialog when generating with active exists
  - [x] 5.7 Update index.ts exports for new components
  - [x] 5.8 Verify end-to-end flows work: accept, reject with both options, return visit, expiry behavior
