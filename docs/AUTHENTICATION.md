# Authentication

This document describes the authentication architecture for the Adaptive Training Plan application.

## Overview

The application uses **localStorage-based authentication** with JWT tokens:

1. User authenticates via Strava OAuth
2. Backend generates a JWT token and redirects to frontend with token in URL
3. Frontend stores the token in localStorage
4. All API requests include the token via `Authorization: Bearer` header

## Authentication Flow

### Login (OAuth with Strava)

```
1. User clicks "Connect with Strava" on /login
   └─→ Redirects to: GET /api/auth/strava

2. Backend redirects to Strava OAuth consent screen
   └─→ User authorizes the application

3. Strava redirects back to: GET /api/auth/strava/callback?code=...
   └─→ Backend exchanges code for Strava tokens
   └─→ Backend creates/updates user in MongoDB
   └─→ Backend generates JWT containing:
       - userId (MongoDB ObjectId)
       - stravaId
       - stravaAccessToken
       - stravaRefreshToken
       - stravaTokenExpiresAt
   └─→ Redirects to: /auth/callback?token=<jwt>

4. Frontend /auth/callback page:
   └─→ Extracts token from URL
   └─→ Stores token in localStorage
   └─→ Redirects to /dashboard
```

### Logout

```
1. User clicks "Logout" in navigation dropdown
2. Frontend removes token from localStorage
3. Redirects to /login
```

### Authenticated API Requests

```
1. Frontend makes API request
   └─→ ky beforeRequest hook adds Authorization header from localStorage

2. Backend middleware reads JWT from Authorization header
   └─→ Verifies JWT signature and expiration
   └─→ Attaches user payload to request object

3. Route handler accesses req.user for user context
```

## Security Considerations

### XSS Vulnerability

localStorage is accessible to JavaScript, making tokens vulnerable to XSS attacks. Mitigations:
- Use Content Security Policy (CSP) headers
- Sanitize all user input
- Keep dependencies updated

### Token Storage Comparison

| Storage Method | XSS Vulnerable | CSRF Vulnerable | SSR Compatible |
|---------------|----------------|-----------------|----------------|
| localStorage | Yes | No | No |
| sessionStorage | Yes | No | No |
| HttpOnly Cookie | No | Possible | Yes |

**Note**: HttpOnly cookies are more secure but require same-domain deployment due to third-party cookie restrictions in modern browsers.

## API Reference

### GET /api/auth/strava

Initiates Strava OAuth flow. Redirects to Strava authorization page.

### GET /api/auth/strava/callback

Handles OAuth callback from Strava. Redirects to frontend with JWT token.

**Query Parameters:**
- `code`: Authorization code from Strava
- `error`: Error message if authorization failed

**Redirect:** `{FRONTEND_URL}/auth/callback?token=<jwt>`

### GET /api/auth/me

Returns the authenticated user's profile.

**Headers:**
- `Authorization: Bearer <jwt>`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "...",
    "stravaId": 12345,
    "firstName": "John",
    "lastName": "Doe",
    "profilePhoto": "https://...",
    "experienceLevel": "intermediate"
  }
}
```

## Frontend Utilities

### `getToken(): string | null`

Returns the JWT token from localStorage, or null if not present.

```typescript
import { getToken } from "@/lib/auth";

const token = getToken();
```

### `setToken(token: string): void`

Stores the JWT token in localStorage.

```typescript
import { setToken } from "@/lib/auth";

setToken(jwtToken);
```

### `removeToken(): void`

Removes the JWT token from localStorage.

```typescript
import { removeToken } from "@/lib/auth";

removeToken();
```

### `isAuthenticated(): boolean`

Returns `true` if a token exists in localStorage.

```typescript
import { isAuthenticated } from "@/lib/auth";

if (isAuthenticated()) {
  // User is logged in
}
```

### `logout(): Promise<void>`

Removes the token and redirects to `/login`.

```typescript
import { logout } from "@/lib/auth";

await logout();
```

## Route Protection

Since localStorage is not accessible on the server, route protection is handled client-side using the `useAuthGuard` hook.

### `useAuthGuard` Hook

Redirects unauthenticated users to the login page.

```typescript
import { useAuthGuard } from "@/hooks/use-auth-guard";

const ProtectedPage = () => {
  useAuthGuard();

  return <div>Protected content</div>;
};
```

**Note**: There may be a brief flash of content before the redirect. For better UX, show a loading state while checking authentication.

## Troubleshooting

### Token not being sent

1. Check localStorage in DevTools > Application > Local Storage
2. Verify the token key is `auth_token`
3. Check Network tab for `Authorization` header on requests

### 401 errors after login

1. Verify token exists in localStorage
2. Check the JWT hasn't expired
3. Verify the JWT secret matches between environments

### Authentication loop

1. Clear localStorage: `localStorage.removeItem('auth_token')`
2. Check browser console for errors
3. Verify the callback page is correctly storing the token

## Development Setup

1. Set environment variables:
   ```
   JWT_SECRET=<at-least-32-characters>
   FRONTEND_URL=http://localhost:3000
   ```

2. Start both servers:
   ```bash
   pnpm dev
   ```

3. Test the flow:
   - Go to `/login`
   - Click "Connect with Strava"
   - After OAuth, check localStorage for `auth_token`
   - Verify API requests include `Authorization` header
