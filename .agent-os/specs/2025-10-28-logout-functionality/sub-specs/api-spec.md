# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-10-28-logout-functionality/spec.md

## Endpoints

### POST /api/auth/logout

**Purpose:** Log the user logout event and terminate the session

**Authentication:** Required (JWT token in Authorization header)

**Request Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Request Body:** None

**Success Response:**
```json
HTTP/1.1 200 OK
Content-Type: application/json

{
  "message": "Logged out successfully"
}
```

**Error Responses:**

**401 Unauthorized** - Missing or invalid JWT token
```json
{
  "error": "User not authenticated"
}
```

**500 Internal Server Error** - Server error during logout
```json
{
  "error": "Logout failed"
}
```

## Implementation Details

**Controller Logic:**
1. Verify JWT token using `authenticateJWT` middleware
2. Extract user information from `req.user` (userId, stravaId)
3. Log logout event to console:
   ```
   User logout: userId={userId}, stravaId={stravaId}, timestamp={ISO_TIMESTAMP}
   ```
4. Return success response

**Security Considerations:**
- JWT token is not invalidated on the server (stateless approach)
- Token will naturally expire based on its expiration time (24h)
- Client is responsible for removing token from localStorage
- Future enhancement: Implement token blacklist for immediate revocation

**Error Handling:**
- Handle missing user in request (shouldn't happen with middleware)
- Catch and log any server errors
- Return appropriate HTTP status codes
