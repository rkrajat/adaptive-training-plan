# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-11-13-runner-experience-level/spec.md

## Endpoints

### GET /api/users/profile

**Purpose:** Retrieve current user's profile information including experience level

**Authentication:** Required (JWT token in Authorization header)

**Request:**
```http
GET /api/users/profile HTTP/1.1
Authorization: Bearer <jwt_token>
```

**Response (Success - 200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "runner@example.com",
  "name": "John Runner",
  "stravaId": "12345678",
  "experienceLevel": "intermediate",
  "createdAt": "2025-10-01T12:00:00.000Z",
  "updatedAt": "2025-11-13T14:30:00.000Z"
}
```

**Response (Experience Level Not Set):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "runner@example.com",
  "name": "John Runner",
  "stravaId": "12345678",
  "experienceLevel": null,
  "createdAt": "2025-10-01T12:00:00.000Z",
  "updatedAt": "2025-10-01T12:00:00.000Z"
}
```

**Errors:**
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - User not found in database
- `500 Internal Server Error` - Database connection error or unexpected server error

---

### PATCH /api/users/profile/experience-level

**Purpose:** Update the current user's running experience level

**Authentication:** Required (JWT token in Authorization header)

**Request:**
```http
PATCH /api/users/profile/experience-level HTTP/1.1
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "experienceLevel": "advanced"
}
```

**Request Body Schema (Zod):**
```typescript
{
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced'])
}
```

**Response (Success - 200 OK):**
```json
{
  "id": "507f1f77bcf86cd799439011",
  "email": "runner@example.com",
  "name": "John Runner",
  "stravaId": "12345678",
  "experienceLevel": "advanced",
  "createdAt": "2025-10-01T12:00:00.000Z",
  "updatedAt": "2025-11-13T14:35:00.000Z"
}
```

**Errors:**
- `400 Bad Request` - Invalid experience level value
  ```json
  {
    "error": "Validation error",
    "details": {
      "experienceLevel": "Must be one of: beginner, intermediate, advanced"
    }
  }
  ```
- `401 Unauthorized` - Missing or invalid authentication token
- `404 Not Found` - User not found in database
- `500 Internal Server Error` - Database update error or unexpected server error

---

## Controllers

### getUserProfile

**File:** `apps/api/src/controllers/user.controller.ts`

**Business Logic:**
1. Extract user ID from authenticated request (JWT middleware)
2. Query User model by ID
3. Return user document with all profile fields
4. Handle user not found scenario

**Error Handling:**
- Catch database query errors
- Return appropriate HTTP status codes
- Log errors for monitoring

**Example Implementation:**
```typescript
export const getUserProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user.id; // From auth middleware
    const user = await User.findById(userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
```

---

### updateExperienceLevel

**File:** `apps/api/src/controllers/user.controller.ts`

**Business Logic:**
1. Extract user ID from authenticated request
2. Validate request body using Zod schema
3. Update User document with new experience level
4. Return updated user document
5. Handle validation errors and database errors

**Validation:**
- Use Zod middleware to validate request body
- Ensure experience level is one of: 'beginner', 'intermediate', 'advanced'
- Case-insensitive input (converted to lowercase by Mongoose)

**Error Handling:**
- Return 400 for validation errors with field-level details
- Return 404 if user not found
- Return 500 for database errors
- Log all errors for debugging

**Example Implementation:**
```typescript
import { z } from 'zod';

const experienceLevelSchema = z.object({
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced'])
});

export const updateExperienceLevel = async (req: AuthRequest, res: Response) => {
  try {
    // Validate request body
    const validation = experienceLevelSchema.safeParse(req.body);

    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation error',
        details: validation.error.flatten().fieldErrors
      });
    }

    const userId = req.user.id;
    const { experienceLevel } = validation.data;

    // Update user document
    const user = await User.findByIdAndUpdate(
      userId,
      { experienceLevel },
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.status(200).json(user);
  } catch (error) {
    console.error('Error updating experience level:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
```

---

## Middleware

### Authentication Middleware

**Required:** All endpoints require JWT authentication

**Middleware:** `authMiddleware`

**Behavior:**
- Extract JWT token from `Authorization: Bearer <token>` header
- Verify token signature and expiration
- Attach user ID to `req.user`
- Return 401 if token missing/invalid

---

## Integration Points

### Frontend Integration

**Profile Settings Page:**
- Call `GET /api/users/profile` on page load to fetch current level
- Call `PATCH /api/users/profile/experience-level` on user selection
- Use TanStack Query for caching and optimistic updates

**Training Plan Upload:**
- Call `GET /api/users/profile` to pre-populate experience level selector
- Optionally call `PATCH /api/users/profile/experience-level` if user updates during upload

### Recommendation Engine Integration

**Future Use:**
- Recommendation engine will fetch user profile via `GET /api/users/profile`
- Use `experienceLevel` field to adjust LLM prompt parameters
- No changes to recommendation API required (reads from user model)
