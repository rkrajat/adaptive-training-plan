# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-10-26-strava-oauth-integration/spec.md

## Technical Requirements

### Backend (apps/api)

**OAuth Endpoints:**
- `GET /api/auth/strava` - Initiates OAuth flow, redirects to Strava authorization page
- `GET /api/auth/strava/callback` - Handles OAuth callback, exchanges code for tokens
- `GET /api/auth/me` - Returns current authenticated user info (requires JWT)

**Strava API Integration:**
- Use node-strava-v3 library (v3.0.0) for OAuth and API calls
- Configure Strava client with client ID and client secret from environment variables
- OAuth scope: `read,activity:read_all` to access profile and activity data
- Store access token in JWT payload (short-lived, session only)

**JWT Implementation:**
- Use `jsonwebtoken` library for token generation and verification
- Token payload: `{ userId, stravaId, stravaAccessToken, iat, exp }`
- Token expiration: 24 hours
- Sign tokens with secret from environment variable `JWT_SECRET`
- Implement middleware to verify JWT from `Authorization: Bearer <token>` header

**Activity Fetching:**
- `GET /api/activities` - Fetches last 30 days of activities from Strava
- Use JWT to extract Strava access token
- Call Strava API `athlete/activities` endpoint with date range
- Return activities with fields: id, name, distance, moving_time, type, start_date, average_heartrate

**Environment Variables:**
- `STRAVA_CLIENT_ID` - Strava application client ID
- `STRAVA_CLIENT_SECRET` - Strava application client secret
- `STRAVA_REDIRECT_URI` - OAuth callback URL (e.g., http://localhost:4000/api/auth/strava/callback)
- `JWT_SECRET` - Secret for signing JWT tokens
- `FRONTEND_URL` - Frontend URL for redirecting after OAuth (e.g., http://localhost:3000)

### Frontend (apps/web)

**Login Page (app/login/page.tsx):**
- Create full-page centered layout with Tailwind CSS utility classes
- Display "Adaptive Training Plan" title
- Show "Login with Strava" button (shadcn/ui Button with orange Strava brand color #FC4C02)
- Button redirects to backend OAuth endpoint: `GET ${API_URL}/api/auth/strava`
- Use shadcn/ui `Button` and `Card` components with Tailwind for layout

**Dashboard Page (app/dashboard/page.tsx):**
- Protected route - check for JWT token in localStorage
- If no token, redirect to /login
- Display user profile section with name and photo
- Display activities list in a card layout
- Use TanStack Query to fetch activities from backend
- Show loading state while fetching
- Show error state if fetch fails

**API Client:**
- Create `lib/api.ts` with ky HTTP client configured with JWT interceptor
- Add `Authorization: Bearer <token>` header to all requests
- Store JWT token in localStorage after OAuth callback

**OAuth Callback Handling:**
- Create callback page at `app/auth/callback/page.tsx`
- Extract JWT token from URL query parameter (set by backend redirect)
- Store token in localStorage
- Redirect to /dashboard

**Shared Types:**
- Create `packages/types/src/strava.ts` with Activity and User interfaces
- Export types for use in both frontend and backend

### UI/UX Specifications

**Login Page:**
- Centered container with max width 400px
- Vertical stack with spacing of 6
- Heading: size "2xl", weight "bold"
- Button: size "lg", full width, orange background (#FC4C02), white text
- Button hover state: darker orange

**Dashboard:**
- Header section with user info: avatar (w-16 h-16 rounded-full), name (text-2xl font-semibold)
- Activities section: grid layout with shadcn/ui Card components
- Each activity card shows: name, distance (in miles), duration (formatted), type, date
- Use shadcn/ui Card components with hover effect (hover:shadow-md transition)
- Responsive grid: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4

## External Dependencies

**Backend:**
- **jsonwebtoken** (^9.0.2) - JWT token generation and verification
  - **Justification:** Industry standard for stateless authentication, required for implementing JWT-based sessions

**Frontend:**
- **ky** (^1.2.0) - Modern HTTP client with better API than fetch
  - **Justification:** Simpler API, better error handling, and request/response interceptors for JWT injection
