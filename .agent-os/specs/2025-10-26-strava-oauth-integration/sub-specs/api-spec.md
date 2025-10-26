# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-10-26-strava-oauth-integration/spec.md

## Endpoints

### GET /api/auth/strava

**Purpose:** Initiates Strava OAuth flow by redirecting user to Strava authorization page

**Parameters:** None

**Response:** HTTP 302 redirect to Strava OAuth URL

**Example:**
```
GET http://localhost:4000/api/auth/strava
→ Redirects to: https://www.strava.com/oauth/authorize?client_id=...&redirect_uri=...&response_type=code&scope=read,activity:read_all
```

**Implementation:**
```typescript
router.get('/auth/strava', (req, res) => {
  const authUrl = strava.oauth.getRequestAccessURL({
    scope: 'read,activity:read_all',
  });
  res.redirect(authUrl);
});
```

**Errors:** None (always redirects)

---

### GET /api/auth/strava/callback

**Purpose:** Handles OAuth callback from Strava, exchanges authorization code for access token, creates/updates user, and issues JWT

**Parameters:**
- `code` (query, required): OAuth authorization code from Strava
- `scope` (query, optional): Granted scopes from Strava

**Response:** HTTP 302 redirect to frontend with JWT token

**Success Response:**
```
HTTP 302 Found
Location: http://localhost:3000/auth/callback?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Implementation Flow:**
1. Extract `code` from query parameters
2. Exchange code for access token via Strava API
3. Fetch athlete profile from Strava using access token
4. Find or create user in MongoDB by `stravaId`
5. Generate JWT with payload: `{ userId, stravaId, stravaAccessToken }`
6. Redirect to `${FRONTEND_URL}/auth/callback?token=${jwt}`

**Errors:**
- `400 Bad Request` - Missing or invalid authorization code
- `500 Internal Server Error` - Strava API error or database error

---

### GET /api/auth/me

**Purpose:** Returns current authenticated user's profile information

**Parameters:**
- `Authorization` (header, required): Bearer JWT token

**Response:** JSON with user profile

**Success Response (200 OK):**
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "stravaId": 12345678,
    "firstName": "John",
    "lastName": "Doe",
    "profilePhoto": "https://dgalywyr863hv.cloudfront.net/pictures/athletes/12345678/large.jpg"
  }
}
```

**Implementation:**
```typescript
router.get('/auth/me', authenticateJWT, async (req, res) => {
  const user = await User.findById(req.user.userId);
  res.json({ user });
});
```

**Errors:**
- `401 Unauthorized` - Missing or invalid JWT token
- `404 Not Found` - User not found in database

---

### GET /api/activities

**Purpose:** Fetches user's activities from Strava for the last 30 days

**Parameters:**
- `Authorization` (header, required): Bearer JWT token
- `page` (query, optional): Page number for pagination (default: 1)
- `per_page` (query, optional): Activities per page (default: 30, max: 200)

**Response:** JSON array of activities

**Success Response (200 OK):**
```json
{
  "activities": [
    {
      "id": 11234567890,
      "name": "Morning Run",
      "distance": 8046.72,
      "moving_time": 2400,
      "type": "Run",
      "start_date": "2025-10-20T06:30:00Z",
      "average_heartrate": 145.3
    },
    {
      "id": 11234567891,
      "name": "Easy Recovery Run",
      "distance": 5000,
      "moving_time": 1800,
      "type": "Run",
      "start_date": "2025-10-19T07:00:00Z",
      "average_heartrate": 130.5
    }
  ]
}
```

**Implementation:**
```typescript
router.get('/activities', authenticateJWT, async (req, res) => {
  const { stravaAccessToken } = req.user;
  const after = Math.floor(Date.now() / 1000) - (30 * 24 * 60 * 60); // 30 days ago

  const activities = await strava.athlete.listActivities({
    access_token: stravaAccessToken,
    after,
    per_page: req.query.per_page || 30,
    page: req.query.page || 1,
  });

  res.json({ activities });
});
```

**Errors:**
- `401 Unauthorized` - Missing or invalid JWT token
- `403 Forbidden` - Strava access token expired or invalid
- `500 Internal Server Error` - Strava API error

---

## Middleware

### authenticateJWT

**Purpose:** Validates JWT token and attaches user info to request object

**Implementation:**
```typescript
import jwt from 'jsonwebtoken';

interface JWTPayload {
  userId: string;
  stravaId: number;
  stravaAccessToken: string;
}

export const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET) as JWTPayload;
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};
```

**Usage:**
```typescript
router.get('/protected-route', authenticateJWT, (req, res) => {
  // req.user contains { userId, stravaId, stravaAccessToken }
});
```

## CORS Configuration

**Required for OAuth redirect flow:**
```typescript
import cors from 'cors';

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
```

## Environment Variables Reference

```bash
# Backend (.env)
STRAVA_CLIENT_ID=your_strava_client_id
STRAVA_CLIENT_SECRET=your_strava_client_secret
STRAVA_REDIRECT_URI=http://localhost:4000/api/auth/strava/callback
JWT_SECRET=your_random_secret_key_min_32_chars
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/adaptive-training-plan

# Frontend (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:4000
```
