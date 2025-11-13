# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-11-13-runner-experience-level/spec.md

> Created: 2025-11-13
> Status: Ready for Implementation

## Tasks

- [ ] 1. Implement Database Schema and Backend API
  - [ ] 1.1 Write tests for User model experienceLevel field validation
  - [ ] 1.2 Update User Mongoose model with experienceLevel field (enum: beginner/intermediate/advanced)
  - [ ] 1.3 Write tests for GET /api/users/profile endpoint
  - [ ] 1.4 Write tests for PATCH /api/users/profile/experience-level endpoint
  - [ ] 1.5 Implement getUserProfile controller in user.controller.ts
  - [ ] 1.6 Implement updateExperienceLevel controller with Zod validation
  - [ ] 1.7 Add routes to Express router with authentication middleware
  - [ ] 1.8 Verify all backend tests pass

- [ ] 2. Create Shared TypeScript Types and Component
  - [ ] 2.1 Write tests for ExperienceLevelSelector component
  - [ ] 2.2 Define ExperienceLevel type in packages/types
  - [ ] 2.3 Create Zod schema for experience level validation in packages/types
  - [ ] 2.4 Build ExperienceLevelSelector component in packages/ui using shadcn/ui Select
  - [ ] 2.5 Add component documentation and Storybook stories (if applicable)
  - [ ] 2.6 Verify component tests pass

- [ ] 3. Implement Frontend API Client and State Management
  - [ ] 3.1 Write tests for user profile queries and mutations
  - [ ] 3.2 Create ky HTTP client configuration in apps/web/lib/api-client.ts
  - [ ] 3.3 Implement useUserProfile query hook using TanStack Query
  - [ ] 3.4 Implement useUpdateExperienceLevel mutation hook with optimistic updates
  - [ ] 3.5 Update Zustand user store to include experienceLevel field
  - [ ] 3.6 Add setExperienceLevel action to user store
  - [ ] 3.7 Verify all API integration tests pass

- [ ] 4. Build Profile Settings UI
  - [ ] 4.1 Write tests for profile settings page experience level section
  - [ ] 4.2 Create or update profile settings page route (apps/web/app/(authenticated)/profile/page.tsx)
  - [ ] 4.3 Integrate ExperienceLevelSelector component into profile page
  - [ ] 4.4 Implement form submission with useUpdateExperienceLevel mutation
  - [ ] 4.5 Add loading states and error handling with Toast notifications
  - [ ] 4.6 Style with Tailwind CSS following design system
  - [ ] 4.7 Test accessibility (keyboard navigation, ARIA labels, screen reader)
  - [ ] 4.8 Verify profile settings UI tests pass

- [ ] 5. Integrate Experience Level into Training Plan Upload Flow
  - [ ] 5.1 Write tests for training plan upload experience level integration
  - [ ] 5.2 Add ExperienceLevelSelector to training plan upload page/flow
  - [ ] 5.3 Pre-populate selector with current user experience level from Zustand store
  - [ ] 5.4 Implement conditional rendering (highlight if not set, optional if already set)
  - [ ] 5.5 Connect to useUpdateExperienceLevel mutation for updates
  - [ ] 5.6 Add appropriate styling and responsive design
  - [ ] 5.7 Test complete upload flow with experience level selection
  - [ ] 5.8 Verify all integration tests pass

## Implementation Notes

**Dependencies:**
- Task 1 (Backend) must be completed before Task 3 (API client)
- Task 2 (Shared component) can be developed in parallel with Task 1
- Tasks 4 and 5 depend on Tasks 1, 2, and 3

**Testing Strategy:**
- Follow TDD approach: write tests first for each component
- Use React Testing Library for frontend component tests
- Use Jest/Vitest for backend unit tests
- Use MSW (Mock Service Worker) for API mocking in frontend tests
- Verify E2E flow manually after all tasks complete

**Tech Stack Reminders:**
- Use shadcn/ui Select or RadioGroup component (no custom UI)
- Use Tailwind CSS only (no inline styles)
- Use arrow functions and named exports exclusively
- Use TanStack Query for all API calls
- Use Zod for schema validation on both frontend and backend
- Ensure TypeScript strict mode compliance
