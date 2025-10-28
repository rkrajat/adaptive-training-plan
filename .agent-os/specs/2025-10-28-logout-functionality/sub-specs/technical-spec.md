# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-10-28-logout-functionality/spec.md

## Technical Requirements

### Frontend Implementation

**Navigation Header Component** (`apps/web/components/Navigation.tsx`)
- Create reusable navigation header component with Tailwind CSS styling
- Include user profile section (avatar + name) on the left
- Include logout button on the right with Strava orange color (#FC4C02)
- Component should be responsive (mobile-friendly)
- Must be client component (use 'use client' directive)

**Dashboard Page Update** (`apps/web/app/dashboard/page.tsx`)
- Import and render Navigation component at the top
- Pass user data from existing query to Navigation component
- Maintain existing dashboard functionality

**Logout Handler** (`apps/web/lib/auth.ts`)
- Add `logout()` function that:
  1. Calls backend `/api/auth/logout` endpoint
  2. Removes JWT token from localStorage using `removeToken()`
  3. Redirects to `/login` page using `window.location.href`
- Handle errors gracefully (still logout locally even if backend call fails)

### Backend Implementation

**Logout Endpoint** (`apps/api/src/routes/auth.ts`)
- Add `POST /api/auth/logout` route with JWT authentication middleware
- Extract user information from JWT token
- Log logout event to console with timestamp and user ID
- Return success response with status 200
- Handle errors and return appropriate status codes

### UI/UX Specifications

**Navigation Header Styling**
- Background: white with bottom border (border-gray-200)
- Height: 64px (h-16)
- Fixed positioning or static (discuss with user)
- Logout button: rounded-md, Strava orange background, white text
- Logout button hover state: darker orange (#E34402)
- User avatar: 40px circle (h-10 w-10)
- User name: text-base, font-semibold, text-gray-900

**Responsive Behavior**
- Desktop: Horizontal layout with avatar+name on left, logout on right
- Mobile: Stack vertically or use hamburger menu (discuss with user)

**Loading States**
- Show loading indicator on logout button while API call is in progress
- Disable button during logout to prevent double-clicks

**Error Handling**
- If backend logout fails, still clear token and redirect (fail gracefully)
- Log errors to console for debugging

## Performance Considerations

- Navigation component should memoize user data to avoid re-renders
- Logout API call should have 5-second timeout
- Token removal should be synchronous (localStorage operation)
