# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-11-13-runner-experience-level/spec.md

## Technical Requirements

### Frontend Components (Next.js App Router)

**Profile Settings Page (`apps/web/app/(authenticated)/profile/page.tsx`)**
- Add "Running Experience Level" section to existing profile page or create new settings route
- Use shadcn/ui Select component or RadioGroup component for level selection
- Options: "Beginner", "Intermediate", "Advanced"
- Display current selection with visual feedback
- Form validation using Zod schema
- Show loading state during save operation
- Display success/error toast notifications using shadcn/ui Toast

**Training Plan Upload Flow (`apps/web/app/(authenticated)/plans/upload/...`)**
- Add experience level selector as step in upload flow or inline field
- Pre-populate with current user experience level from Zustand store
- Conditional rendering: highlight if not yet set, show as optional update if already set
- Use same component as profile settings for consistency

**Shared Component (`packages/ui/src/experience-level-selector.tsx`)**
- Reusable ExperienceLevelSelector component
- Props: `value`, `onChange`, `disabled`, `required`
- TypeScript interface for ExperienceLevel type
- Accessibility: proper ARIA labels, keyboard navigation

### State Management (Zustand)

**User Store (`apps/web/stores/user-store.ts`)**
- Add `experienceLevel` field to user state interface
- Create `setExperienceLevel` action
- Sync with backend on update via TanStack Query mutation

### API Integration (TanStack Query + ky)

**Queries (`apps/web/lib/queries/user.ts`)**
- `useUserProfile` - Fetch user profile including experience level
- `useUpdateExperienceLevel` - Mutation to update experience level
- Optimistic updates for immediate UI feedback
- Automatic cache invalidation on successful update

**HTTP Client (`apps/web/lib/api-client.ts`)**
- Configure ky instance with base URL and auth headers
- Error handling for network failures and validation errors

### Backend API (Express.js)

**Routes (`apps/api/src/routes/user.ts`)**
- `GET /api/users/profile` - Return user profile including experience level
- `PATCH /api/users/profile/experience-level` - Update experience level
- Apply authentication middleware to protect routes

**Controllers (`apps/api/src/controllers/user.controller.ts`)**
- `getUserProfile` - Fetch user document and return profile data
- `updateExperienceLevel` - Validate input, update user document, return updated data

**Validation Middleware**
- Use Zod schema to validate experience level input
- Enum validation: only "beginner", "intermediate", "advanced" allowed (lowercase storage)
- Return 400 Bad Request for invalid values

### Styling

- Use Tailwind CSS utility classes exclusively
- Follow existing design system patterns from shadcn/ui components
- Responsive design: mobile-first approach
- Consistent spacing using Tailwind spacing scale (e.g., `space-y-4`, `px-6`)

### Error Handling

- Frontend: Display user-friendly error messages via Toast component
- Backend: Return appropriate HTTP status codes (400, 401, 500)
- Validation errors: Include field-level error messages
- Network errors: Implement retry logic in TanStack Query

### Accessibility

- Semantic HTML elements
- ARIA labels for screen readers
- Keyboard navigation support
- Focus management
- Color contrast compliance (WCAG AA)

### Performance

- Optimistic updates for instant UI feedback
- Query caching with TanStack Query (5-minute stale time)
- Debounced auto-save (if implemented)
- Minimal bundle size: use tree-shakeable imports

## External Dependencies

No new external dependencies required. All features can be implemented using the existing tech stack:
- shadcn/ui components (Select or RadioGroup)
- Tailwind CSS for styling
- Zod for validation (already in stack)
- TanStack Query for data fetching (already in stack)
- ky for HTTP requests (already in stack)
