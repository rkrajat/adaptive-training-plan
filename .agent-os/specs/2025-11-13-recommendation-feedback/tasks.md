# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-11-13-recommendation-feedback/spec.md

> Created: 2025-11-13
> Status: Ready for Implementation

## Tasks

- [ ] 1. Database Layer - RecommendationFeedback Model

  - [ ] 1.1 Create RecommendationFeedback model with schema (userId, recommendationId, usefulnessRating, wouldFollow, comment, timestamps)
  - [ ] 1.2 Add compound unique index on (userId, recommendationId)
  - [ ] 1.3 Add individual indexes on recommendationId and userId for query performance
  - [ ] 1.4 Add index on recommendationId + createdAt (descending) for admin queries

- [ ] 2. Backend API - Zod Validation Schemas

  - [ ] 2.1 Create submitFeedbackSchema with rating (1-5), wouldFollow (boolean), comment (optional string, max 1000 chars)
  - [ ] 2.2 Create feedbackResponseSchema for API response structure
  - [ ] 2.3 Add validation error messages for each field
  - [ ] 2.4 Export TypeScript types from schemas
  - [ ] 2.5 Verify all tests pass

- [ ] 3. Backend API - Feedback Controller

  - [ ] 3.1 Create FeedbackController with submitFeedback method
  - [ ] 3.2 Implement duplicate feedback check using findOne with userId and recommendationId
  - [ ] 3.3 Add request body validation using submitFeedbackSchema
  - [ ] 3.4 Implement feedback creation and save to database
  - [ ] 3.5 Add error handling for database errors and validation failures
  - [ ] 3.6 Return appropriate HTTP status codes (201, 400, 404, 409, 500)

- [ ] 4. Backend API - Additional Controller Methods

  - [ ] 4.1 Implement checkFeedbackStatus method to return boolean for current user
  - [ ] 4.2 Implement getRecommendationFeedback method for admin analytics (future use)
  - [ ] 4.3 Add proper error handling and status codes

- [ ] 5. Backend API - Route Configuration

  - [ ] 5.1 Create feedback router in Express
  - [ ] 5.2 Configure POST /api/feedback route with auth middleware
  - [ ] 5.3 Configure GET /api/feedback/status/:recommendationId route with auth middleware
  - [ ] 5.4 Configure GET /api/feedback/recommendation/:recommendationId route with auth and admin middleware
  - [ ] 5.5 Add rate limiting middleware to routes
  - [ ] 5.6 Connect routes to FeedbackController methods
  - [ ] 5.7 Mount feedback router in main Express app

- [ ] 6. Frontend Types - TypeScript Definitions

  - [ ] 6.1 Create FeedbackFormData type (rating: number, wouldFollow: boolean, comment?: string)
  - [ ] 6.2 Create FeedbackSubmitRequest type matching API contract (recommendationId, rating, wouldFollow, comment)
  - [ ] 6.3 Create FeedbackSubmitResponse type for API response (id, createdAt, message)
  - [ ] 6.4 Create FeedbackStatusResponse type (hasSubmitted: boolean)
  - [ ] 6.5 Create FeedbackError type for error handling
  - [ ] 6.6 Create types.ts file in feedback component directory
  - [ ] 6.7 Export all types from types.ts

- [ ] 7. Frontend API Service - TanStack Query Hooks

  - [ ] 7.1 Create feedback-service.ts with submitFeedback and checkFeedbackStatus functions
  - [ ] 7.2 Create useFeedbackSubmit mutation hook using TanStack Query
  - [ ] 7.3 Implement POST request to /api/feedback endpoint with error transformation
  - [ ] 7.4 Create useFeedbackStatus query hook for checking submission status
  - [ ] 7.5 Add query invalidation on successful submission
  - [ ] 7.6 Implement onSuccess and onError callbacks

- [ ] 8. UI Components - Star Rating Component

  - [ ] 8.1 Create StarRating.tsx component file
  - [ ] 8.2 Implement star icons (filled/unfilled) using lucide-react
  - [ ] 8.3 Add hover state to preview rating selection
  - [ ] 8.4 Add click handler to set rating value
  - [ ] 8.5 Add keyboard navigation support (arrow keys to move, enter to select)
  - [ ] 8.6 Add Tailwind CSS styling for visual feedback (hover, focus, active states)

- [ ] 9. UI Components - Feedback Modal

  - [ ] 9.1 Create FeedbackModal.tsx using shadcn/ui Dialog component
  - [ ] 9.2 Add Dialog.Header with title ("How was this recommendation?") and description
  - [ ] 9.3 Integrate StarRating component for usefulnessRating input
  - [ ] 9.4 Add Yes/No toggle using shadcn/ui RadioGroup for wouldFollow field
  - [ ] 9.5 Add optional comment textarea using shadcn/ui Textarea
  - [ ] 9.6 Implement character counter for comment (1000 max)
  - [ ] 9.7 Implement form validation using Zod (rating required)
  - [ ] 9.8 Disable submit button until rating is selected
  - [ ] 9.9 Add submit button with loading state (spinner, disabled state)
  - [ ] 9.10 Add cancel button to close modal
  - [ ] 9.11 Add focus trap in modal for accessibility

- [ ] 10. UI Components - Feedback Button

  - [ ] 10.1 Create FeedbackButton.tsx component file
  - [ ] 10.2 Implement button states (default, loading, submitted) with icons
  - [ ] 10.3 Add feedback icon (MessageSquare) and checkmark icon (Check) from lucide-react
  - [ ] 10.4 Query feedback status using useFeedbackStatus hook on mount
  - [ ] 10.5 Update button state based on feedback status
  - [ ] 10.6 Handle modal open/close logic with useState
  - [ ] 10.7 Disable button when feedback already submitted
  - [ ] 10.8 Add Tailwind CSS styling for different button states

- [ ] 11. Integration - Connect Modal to API Hook

  - [ ] 11.1 Connect FeedbackModal to useFeedbackSubmit hook
  - [ ] 11.2 Implement form submission handler calling mutation.mutate()
  - [ ] 11.3 Add success toast notification using shadcn/ui Toast/Sonner
  - [ ] 11.4 Add error toast notification with user-friendly error messages
  - [ ] 11.5 Implement modal close on successful submission
  - [ ] 11.6 Reset form state (rating, wouldFollow, comment) on modal close

- [ ] 12. Integration - Add Feedback Button to Recommendation View

  - [ ] 12.1 Add FeedbackButton to recommendation view page/component
  - [ ] 12.2 Pass recommendationId prop from recommendation view to FeedbackButton
  - [ ] 12.3 Pass recommendationId from FeedbackButton to FeedbackModal
  - [ ] 12.4 Add button positioning (e.g., bottom right of recommendation card)
  - [ ] 12.5 Add responsive styling with Tailwind CSS
  - [ ] 12.6 Verify all tests pass

- [ ] 13. State Management - Zustand Store (Optional Enhancement)

  - [ ] 13.1 Create feedback-store.ts with Zustand
  - [ ] 13.2 Define store interface with submission tracking (submittedRecommendations: Set<string>)
  - [ ] 13.3 Implement markFeedbackSubmitted action
  - [ ] 13.4 Implement hasFeedbackSubmitted selector
  - [ ] 13.5 Add localStorage persistence (optional)
  - [ ] 13.6 Connect FeedbackButton to feedback store
  - [ ] 13.7 Update store on successful submission
  - [ ] 13.8 Verify all tests pass

- [ ] 14. Polish and Accessibility
  - [ ] 14.1 Configure toast provider (shadcn/ui Sonner) in app layout
  - [ ] 14.2 Add loading animations to submit button (spinner)
  - [ ] 14.3 Add fade-in/fade-out animations to modal
  - [ ] 14.4 Add micro-interactions (hover effects, focus states)
