# Spec Tasks

## Tasks

- [x] 1. Set up backend infrastructure and Strava OAuth configuration
  - [x] 1.1 Create Strava application on Strava Developer Portal and obtain client ID/secret
  - [x] 1.2 Add environment variables to apps/api/.env (STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_REDIRECT_URI, JWT_SECRET, FRONTEND_URL)
  - [x] 1.3 Install dependencies: jsonwebtoken in apps/api
  - [x] 1.4 Configure node-strava-v3 client in apps/api/src/config/strava.ts
  - [x] 1.5 Update CORS configuration in apps/api/src/index.ts to allow credentials
  - [x] 1.6 Verify configuration loads correctly on server start

- [x] 2. Create User model and database schema
  - [x] 2.1 Create apps/api/src/models/User.ts with Mongoose schema (stravaId, firstName, lastName, profilePhoto)
  - [x] 2.2 Add unique index on stravaId field
  - [x] 2.3 Add timestamps option for createdAt/updatedAt
  - [x] 2.4 Connect to MongoDB in apps/api/src/index.ts
  - [x] 2.5 Test database connection and User model creation

- [x] 3. Implement JWT authentication middleware
  - [x] 3.1 Create apps/api/src/middleware/auth.ts with authenticateJWT middleware
  - [x] 3.2 Implement JWT token verification using jsonwebtoken
  - [x] 3.3 Extract userId, stravaId, and stravaAccessToken from token payload
  - [x] 3.4 Handle missing, invalid, and expired tokens with 401 responses
  - [x] 3.5 Attach user payload to req.user for downstream use

- [x] 4. Implement Strava OAuth endpoints
  - [x] 4.1 Create apps/api/src/routes/auth.ts router
  - [x] 4.2 Implement GET /api/auth/strava endpoint to redirect to Strava authorization
  - [x] 4.3 Implement GET /api/auth/strava/callback to handle OAuth callback
  - [x] 4.4 Exchange authorization code for access token using node-strava-v3
  - [x] 4.5 Fetch athlete profile from Strava API
  - [x] 4.6 Create or update User in MongoDB using stravaId
  - [x] 4.7 Generate JWT token with user data and Strava access token
  - [x] 4.8 Redirect to frontend with JWT token in query parameter

- [x] 5. Implement authenticated API endpoints
  - [x] 5.1 Implement GET /api/auth/me endpoint with JWT middleware
  - [x] 5.2 Return user profile data from MongoDB
  - [x] 5.3 Implement GET /api/activities endpoint with JWT middleware
  - [x] 5.4 Fetch activities from Strava API using access token from JWT
  - [x] 5.5 Filter activities to last 30 days
  - [x] 5.6 Return formatted activity data (id, name, distance, moving_time, type, start_date, average_heartrate)
  - [x] 5.7 Handle Strava API errors and return appropriate status codes

- [x] 6. Create shared TypeScript types package
  - [x] 6.1 Create packages/types/src/strava.ts with Activity interface
  - [x] 6.2 Add User interface for user profile data
  - [x] 6.3 Export all types from packages/types/src/index.ts
  - [x] 6.4 Configure package.json with proper exports
  - [x] 6.5 Build types package with TypeScript

- [ ] 7. Set up frontend API client with JWT support
  - [ ] 7.1 Install ky dependency in apps/web
  - [ ] 7.2 Create apps/web/lib/api.ts with ky client configuration
  - [ ] 7.3 Add beforeRequest hook to inject JWT token from localStorage
  - [ ] 7.4 Add afterResponse hook to handle 401 errors and redirect to login
  - [ ] 7.5 Export typed API methods for auth and activities endpoints
  - [ ] 7.6 Create apps/web/lib/auth.ts with token storage utilities (getToken, setToken, removeToken)

- [ ] 8. Create login page
  - [ ] 8.1 Create apps/web/app/login/page.tsx
  - [ ] 8.2 Implement centered layout with Chakra UI Container and VStack
  - [ ] 8.3 Add "Adaptive Training Plan" heading with size 2xl
  - [ ] 8.4 Add "Login with Strava" button with Strava orange color (#FC4C02)
  - [ ] 8.5 Button redirects to backend OAuth endpoint on click
  - [ ] 8.6 Add loading state while redirecting
  - [ ] 8.7 Style page with proper spacing and responsive design

- [ ] 9. Create OAuth callback handler page
  - [ ] 9.1 Create apps/web/app/auth/callback/page.tsx
  - [ ] 9.2 Extract JWT token from URL query parameter on mount
  - [ ] 9.3 Store token in localStorage using auth utility
  - [ ] 9.4 Show loading spinner while processing
  - [ ] 9.5 Redirect to /dashboard after token stored
  - [ ] 9.6 Handle missing token error and redirect to /login

- [ ] 10. Create dashboard page with activities display
  - [ ] 10.1 Create apps/web/app/dashboard/page.tsx
  - [ ] 10.2 Implement route protection: check for JWT token, redirect to /login if missing
  - [ ] 10.3 Create TanStack Query hook to fetch user profile from /api/auth/me
  - [ ] 10.4 Create TanStack Query hook to fetch activities from /api/activities
  - [ ] 10.5 Display user profile section with avatar, name using Chakra UI
  - [ ] 10.6 Display activities in responsive grid layout with Chakra Card components
  - [ ] 10.7 Format activity data (distance in miles, duration in mm:ss, date formatting)
  - [ ] 10.8 Implement loading states with Chakra Spinner
  - [ ] 10.9 Implement error states with Chakra Alert
  - [ ] 10.10 Add empty state when no activities found

- [ ] 11. Integration testing and verification
  - [ ] 11.1 Start both backend (pnpm dev:api) and frontend (pnpm dev:web) servers
  - [ ] 11.2 Test complete OAuth flow: login → Strava authorization → callback → dashboard
  - [ ] 11.3 Verify JWT token is stored in localStorage
  - [ ] 11.4 Verify user profile displays correctly on dashboard
  - [ ] 11.5 Verify activities from last 30 days display correctly
  - [ ] 11.6 Test protected route behavior: access /dashboard without token should redirect to /login
  - [ ] 11.7 Test error handling: expired/invalid tokens should redirect to login
  - [ ] 11.8 Verify all API endpoints return correct status codes and data formats
