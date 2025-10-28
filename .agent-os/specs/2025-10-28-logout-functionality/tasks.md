# Spec Tasks

## Tasks

- [ ] 1. Implement backend logout endpoint
  - [ ] 1.1 Add POST /api/auth/logout route in apps/api/src/routes/auth.ts
  - [ ] 1.2 Implement authenticateJWT middleware protection
  - [ ] 1.3 Extract user information from req.user
  - [ ] 1.4 Log logout event to console with timestamp and user details
  - [ ] 1.5 Return success response with 200 status
  - [ ] 1.6 Test logout endpoint with valid JWT token
  - [ ] 1.7 Test logout endpoint with invalid/missing token

- [ ] 2. Add logout function to frontend auth utilities
  - [ ] 2.1 Create logout() function in apps/web/lib/auth.ts
  - [ ] 2.2 Implement API call to POST /api/auth/logout
  - [ ] 2.3 Remove JWT token from localStorage
  - [ ] 2.4 Redirect to /login page
  - [ ] 2.5 Handle errors gracefully (clear token even if backend fails)
  - [ ] 2.6 Test logout function in browser console

- [ ] 3. Create navigation header component
  - [ ] 3.1 Create apps/web/components/Navigation.tsx as client component
  - [ ] 3.2 Add user profile section (avatar + name) with Tailwind styling
  - [ ] 3.3 Add logout button with Strava orange color (#FC4C02)
  - [ ] 3.4 Implement loading state for logout button
  - [ ] 3.5 Call logout() function on button click
  - [ ] 3.6 Add responsive styling for mobile and desktop
  - [ ] 3.7 Test component in isolation

- [ ] 4. Integrate navigation header into dashboard
  - [ ] 4.1 Import Navigation component in apps/web/app/dashboard/page.tsx
  - [ ] 4.2 Pass user data from existing query to Navigation
  - [ ] 4.3 Test navigation appears correctly on dashboard
  - [ ] 4.4 Verify logout flow works end-to-end
  - [ ] 4.5 Test protected route behavior after logout
  - [ ] 4.6 Verify all existing dashboard functionality still works
