# Authentication

This document describes the authentication architecture for the Adaptive Training Plan application.

## Overview

The application uses a **dual-cookie pattern** for secure authentication:

1. **`auth_token`** (HttpOnly) - Contains the JWT token, not accessible to JavaScript
2. **`session_active`** (Regular) - Simple flag (`"1"`) readable by JavaScript for instant auth state checks

This approach is used by major platforms like GitHub, Stripe, and Vercel because it:
- Protects tokens from XSS attacks (JavaScript cannot read HttpOnly cookies)
- Enables instant client-side auth checks without API calls
- Allows Next.js middleware to protect routes server-side
- Leverages browser's built-in cookie security features

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

4. Backend sets two cookies:
   - auth_token (HttpOnly, contains JWT)
   - session_active (readable, value "1")
   └─→ Redirects to: /auth/callback (no token in URL)

5. Frontend /auth/callback page:
   └─→ Checks if session_active cookie exists
   └─→ Redirects to /dashboard
```

### Logout

```
1. User clicks "Logout" in navigation dropdown
   └─→ Frontend calls: POST /api/auth/logout

2. Backend clears both cookies:
   - auth_token
   - session_active

3. Frontend clears session_active cookie (backup)
   └─→ Redirects to /login
```

### Authenticated API Requests

```
1. Frontend makes API request with credentials: "include"
   └─→ Browser automatically sends auth_token cookie

2. Backend middleware reads JWT from cookie
   └─→ Falls back to Authorization header (backward compatibility)
   └─→ Verifies JWT signature and expiration
   └─→ Attaches user payload to request object

3. Route handler accesses req.user for user context
```

## Cookie Configuration

### auth_token (HttpOnly - Contains JWT)

| Setting | Production | Development | Reason |
|---------|-----------|-------------|--------|
| `httpOnly` | `true` | `true` | Prevents XSS - JS cannot access |
| `secure` | `true` | `false` | HTTPS required for SameSite=None |
| `sameSite` | `none` | `lax` | Cross-origin requires None |
| `path` | `/` | `/` | Available to all routes |
| `maxAge` | 24h | 24h | Matches JWT expiry |

### session_active (Readable - Session Hint)

| Setting | Production | Development | Reason |
|---------|-----------|-------------|--------|
| `httpOnly` | `false` | `false` | JS needs to read for auth state |
| `secure` | `true` | `false` | HTTPS required for SameSite=None |
| `sameSite` | `none` | `lax` | Cross-origin requires None |
| `path` | `/` | `/` | Available to all routes |
| `maxAge` | 24h | 24h | Matches JWT expiry |

## Security Considerations

### XSS Protection

The JWT token is stored in an HttpOnly cookie, making it inaccessible to JavaScript. Even if an attacker injects malicious scripts, they cannot steal the authentication token.

### CSRF Considerations

- `SameSite=None` is required for cross-origin cookies (frontend on Vercel, backend on Render)
- The `Secure` flag ensures cookies are only sent over HTTPS in production
- State-changing operations should use POST/PUT/DELETE methods

### Token Storage Comparison

| Storage Method | XSS Vulnerable | CSRF Vulnerable | SSR Compatible |
|---------------|----------------|-----------------|----------------|
| localStorage | Yes | No | No |
| sessionStorage | Yes | No | No |
| HttpOnly Cookie | No | Possible | Yes |

## API Reference

### POST /api/auth/logout

Clears authentication cookies and ends the session.

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

### GET /api/auth/me

Returns the authenticated user's profile.

**Headers:**
- Cookie: `auth_token=<jwt>` (sent automatically by browser)

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

### GET /api/auth/strava

Initiates Strava OAuth flow. Redirects to Strava authorization page.

### GET /api/auth/strava/callback

Handles OAuth callback from Strava. Sets cookies and redirects to frontend.

**Query Parameters:**
- `code`: Authorization code from Strava
- `error`: Error message if authorization failed

## Frontend Utilities

### `isAuthenticated(): boolean`

Returns `true` if the `session_active` cookie exists. This is a synchronous check that doesn't require an API call.

```typescript
import { isAuthenticated } from "@/lib/auth";

if (isAuthenticated()) {
  // User is logged in
}
```

### `logout(): Promise<void>`

Calls the logout API endpoint and clears the session cookie. Redirects to `/login`.

```typescript
import { logout } from "@/lib/auth";

await logout();
```

## Next.js Middleware (Primary Auth Guard)

The middleware (`apps/web/middleware.ts`) is the **single layer** of route protection. There are no redundant client-side auth checks.

- **Protected routes** (`/dashboard`, `/profile`, `/settings`): Redirect to `/login` if not authenticated
- **Auth routes** (`/login`): Redirect to `/dashboard` if already authenticated

The middleware uses an explicit matcher configuration to only run on specific routes:

```typescript
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/login",
  ],
};
```

Routes not in the matcher (like `/`, `/auth/callback`, static assets) are not processed by the middleware.

### Why Single-Layer Auth?

The middleware guarantees that unauthenticated users never reach protected pages. Additional client-side checks (like `useAuthGuard` hooks or `enabled: isAuthenticated()` on queries) are redundant because:

1. **Middleware runs first** - Before any page component renders
2. **Server-side redirect** - No flash of protected content
3. **401 handling in ky** - If the session expires mid-use, the API client's `afterResponse` hook clears cookies and redirects to `/login`

This approach reduces code complexity and eliminates unnecessary re-renders.

### Cookie Check vs JWT Validation

The middleware checks cookie presence only (instant, no crypto). Actual JWT validation happens on backend API calls. This is intentional - it provides fast server-side routing while deferring expensive validation to the API layer.

## Troubleshooting

### Cookies not being set

1. Ensure CORS is configured with `credentials: true`
2. Verify the frontend URL matches the CORS origin
3. Check that `SameSite` and `Secure` settings match the environment

### Authentication loop

1. Check browser DevTools > Application > Cookies for `session_active`
2. Verify the cookie domain matches your frontend
3. Check the browser console for CORS errors

### 401 errors after login

1. Verify cookies are being sent with requests (`credentials: "include"`)
2. Check the JWT hasn't expired
3. Verify the JWT secret matches between environments

### Safari/iOS issues

Safari's Intelligent Tracking Prevention (ITP) may block third-party cookies. If users report issues:
1. Ensure `SameSite=None; Secure` is set in production
2. Consider using a custom domain that matches the backend
3. Test in Safari private browsing mode

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
   - After OAuth, verify no `?token=` in URL
   - Check cookies in DevTools > Application > Cookies
   - Verify `auth_token` has HttpOnly flag
   - Try `document.cookie` in console - should NOT show `auth_token`
