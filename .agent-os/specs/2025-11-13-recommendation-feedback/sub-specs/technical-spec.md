# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-11-13-recommendation-feedback/spec.md

> Created: 2025-11-13
> Version: 1.0.0

## Technical Requirements

### Frontend Requirements

#### 1. Feedback Modal Component (`FeedbackModal.tsx`)

**Component Structure:**
```typescript
interface FeedbackModalProps {
  recommendationId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}
```

**UI Components (shadcn/ui):**
- `Dialog` - Modal container
- `DialogContent` - Modal content wrapper
- `DialogHeader` / `DialogTitle` / `DialogDescription` - Modal header
- `Button` - Submit and cancel actions
- `RadioGroup` / `RadioGroupItem` - Yes/No selection
- `Textarea` - Comment input
- `Label` - Form field labels

**Custom Rating Component:**
- Star rating input (1-5 stars)
- Interactive hover states
- Click to select rating
- Visual feedback for selected rating
- Built with Tailwind CSS and shadcn/ui Button primitives

**Form Fields:**
1. **Usefulness Rating**
   - Type: Number (1-5)
   - Required: Yes
   - UI: Star rating component
   - Label: "How useful is this recommendation?"
   - Default: No selection (user must choose)

2. **Would Follow**
   - Type: Boolean
   - Required: Yes
   - UI: Radio buttons (Yes/No)
   - Label: "Would you follow it?"
   - Default: No selection (user must choose)

3. **Comment**
   - Type: String
   - Required: No
   - UI: Textarea
   - Label: "Any comments you want to share?"
   - Max length: 1000 characters
   - Placeholder: "Share your thoughts about this recommendation..."
   - Character counter: Display remaining characters

**Validation:**
- Client-side validation using Zod schema
- Disable submit button until required fields are complete
- Display inline error messages for validation failures
- Prevent modal close on backdrop click when form is dirty (warn user)

#### 2. Feedback Button Component (`FeedbackButton.tsx`)

**Component Structure:**
```typescript
interface FeedbackButtonProps {
  recommendationId: string;
  hasFeedback?: boolean;
  onFeedbackSubmitted?: () => void;
}
```

**States:**
- **Default**: "Give Feedback" button (enabled)
- **Submitted**: "Feedback Submitted" with checkmark icon (disabled)
- **Loading**: Spinner while checking feedback status
- **Error**: Retry button if feedback status check fails

**Behavior:**
- Opens FeedbackModal on click
- Queries feedback status on mount using TanStack Query
- Disables button and updates text after successful submission
- Handles modal open/close state

#### 3. State Management (Zustand)

**Feedback Store:**
```typescript
interface FeedbackStore {
  submittedFeedback: Record<string, boolean>; // recommendationId -> submitted
  markFeedbackSubmitted: (recommendationId: string) => void;
  hasFeedbackSubmitted: (recommendationId: string) => boolean;
}
```

**Purpose:**
- Track feedback submission status client-side
- Prevent duplicate API calls
- Persist state across component remounts
- Sync with server state on page load

#### 4. API Integration (TanStack Query)

**Custom Hook: `useFeedbackSubmission`**
```typescript
const useFeedbackSubmission = () => {
  const mutation = useMutation({
    mutationFn: submitFeedback,
    onSuccess: (data, variables) => {
      // Update Zustand store
      // Invalidate feedback status query
      // Show success toast
    },
    onError: (error) => {
      // Show error toast
      // Log error for monitoring
    },
  });
  return mutation;
};
```

**Custom Hook: `useFeedbackStatus`**
```typescript
const useFeedbackStatus = (recommendationId: string) => {
  return useQuery({
    queryKey: ['feedback-status', recommendationId],
    queryFn: () => checkFeedbackStatus(recommendationId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

**API Service Functions:**
```typescript
// services/feedback-service.ts
interface SubmitFeedbackPayload {
  recommendationId: string;
  usefulnessRating: number;
  wouldFollow: boolean;
  comment?: string;
}

const submitFeedback = async (payload: SubmitFeedbackPayload) => {
  const response = await fetch('/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error('Feedback submission failed');
  return response.json();
};

const checkFeedbackStatus = async (recommendationId: string) => {
  const response = await fetch(`/api/feedback/status/${recommendationId}`);
  if (!response.ok) throw new Error('Failed to check feedback status');
  return response.json();
};
```

#### 5. Data Flow

**User Interaction Flow:**
1. User clicks "Give Feedback" button
2. `FeedbackButton` opens `FeedbackModal`
3. User fills form (rating, yes/no, optional comment)
4. User clicks "Submit Feedback"
5. Client validates form using Zod schema
6. `useFeedbackSubmission` mutation triggers
7. POST request sent to `/api/feedback`
8. Backend validates, saves to MongoDB
9. Success response returned
10. Zustand store updated with submission status
11. TanStack Query cache invalidated
12. Success toast displayed
13. Modal closes
14. Button updates to "Feedback Submitted" (disabled)

**Error Handling:**
- Network errors: Retry option with exponential backoff
- Validation errors: Display inline field errors
- Server errors: Generic error toast with retry option
- Duplicate submission: Backend returns 409, UI shows appropriate message

### Backend Requirements

#### 1. API Endpoint Implementation

**Route:** `POST /api/feedback`

**Controller:** `FeedbackController.submitFeedback`

**Responsibilities:**
- Authenticate user (ensure valid JWT token)
- Validate request body using Zod schema
- Check for duplicate feedback (same user + recommendation)
- Create feedback document in MongoDB
- Return success response with feedback ID

**Middleware Stack:**
1. Authentication middleware (verify JWT)
2. Request body parser (JSON)
3. Zod validation middleware
4. Rate limiting (max 10 submissions per minute per user)

#### 2. Validation (Zod Schemas)

**Request Schema:**
```typescript
const submitFeedbackSchema = z.object({
  recommendationId: z.string().min(1, 'Recommendation ID is required'),
  usefulnessRating: z.number().int().min(1).max(5),
  wouldFollow: z.boolean(),
  comment: z.string().max(1000).optional(),
});
```

**Response Schema:**
```typescript
const feedbackResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    feedbackId: z.string(),
    message: z.string(),
  }),
});
```

#### 3. Business Logic

**Duplicate Prevention:**
- Query MongoDB for existing feedback with same `userId` and `recommendationId`
- If exists, return 409 Conflict with message: "Feedback already submitted for this recommendation"
- Use compound unique index for enforcement at database level

**Data Sanitization:**
- Trim whitespace from comment field
- Convert rating to integer
- Ensure boolean type for wouldFollow

**Timestamps:**
- Automatically add `createdAt` timestamp on creation
- Add `updatedAt` if feedback editing is implemented later

#### 4. Error Responses

**400 Bad Request:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid feedback data",
    "details": [
      {
        "field": "usefulnessRating",
        "message": "Rating must be between 1 and 5"
      }
    ]
  }
}
```

**401 Unauthorized:**
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authentication required"
  }
}
```

**409 Conflict:**
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_FEEDBACK",
    "message": "Feedback already submitted for this recommendation"
  }
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Failed to save feedback"
  }
}
```

## Approach

### Implementation Phases

**Phase 1: Database Schema and Models (2-3 hours)**
1. Create Mongoose schema for Feedback collection
2. Define indexes and relationships
3. Write schema validation tests
4. Create database migration script

**Phase 2: Backend API Development (3-4 hours)**
1. Implement POST `/api/feedback` endpoint
2. Add Zod validation middleware
3. Implement feedback submission controller logic
4. Add duplicate check logic
5. Write unit tests for controller
6. Write integration tests for API endpoint
7. Implement GET `/api/feedback/status/:recommendationId` endpoint

**Phase 3: Frontend Components (4-5 hours)**
1. Create star rating component
2. Build FeedbackModal component with form
3. Implement client-side Zod validation
4. Create FeedbackButton component
5. Write component unit tests
6. Add accessibility features (ARIA labels, keyboard navigation)

**Phase 4: API Integration (2-3 hours)**
1. Create TanStack Query hooks
2. Implement feedback service functions
3. Connect components to API hooks
4. Add loading and error states
5. Write integration tests

**Phase 5: State Management (1-2 hours)**
1. Create Zustand feedback store
2. Integrate store with components
3. Test state persistence and synchronization

**Phase 6: UI Polish and Testing (2-3 hours)**
1. Add success/error toast notifications
2. Implement feedback button state transitions
3. Add loading spinners and animations
4. Test complete user flow end-to-end
5. Test error scenarios and edge cases
6. Accessibility audit and fixes

**Total Estimated Time:** 14-20 hours

### Testing Strategy

**Unit Tests:**
- Star rating component interaction
- Form validation logic
- Zod schema validation
- Controller business logic
- Store state mutations

**Integration Tests:**
- API endpoint with database operations
- TanStack Query hooks with mocked API
- Complete feedback submission flow

**E2E Tests:**
- User submits feedback successfully
- Duplicate submission prevention
- Error handling and retry
- Button state transitions

## External Dependencies

**No new packages required.** All necessary dependencies are already part of the tech stack:

- **shadcn/ui**: Dialog, Button, RadioGroup, Textarea, Label components
- **Tailwind CSS**: Styling and layout
- **Zod**: Validation (both client and server)
- **TanStack Query**: API state management
- **Zustand**: Client state management
- **Mongoose**: MongoDB ODM
- **Express.js**: API routing and middleware

**Note:** Star rating component will be built custom using shadcn/ui Button primitives and Tailwind CSS, as shadcn/ui does not include a native rating component.
