# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-10-26-strava-oauth-integration/spec.md

## Schema Changes

### New Collection: `users`

```typescript
interface User {
  _id: ObjectId;
  stravaId: number;           // Unique Strava athlete ID
  firstName: string;          // Athlete's first name
  lastName: string;           // Athlete's last name
  profilePhoto: string;       // URL to profile photo
  createdAt: Date;            // Account creation timestamp
  updatedAt: Date;            // Last update timestamp
}
```

**Mongoose Schema:**

```typescript
import { Schema, model } from 'mongoose';

const userSchema = new Schema(
  {
    stravaId: {
      type: Number,
      required: true,
      unique: true,
      index: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    profilePhoto: {
      type: String,
      required: false,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

export const User = model('User', userSchema);
```

## Indexes

- **stravaId**: Unique index for fast lookups during OAuth callback
  - Prevents duplicate user records
  - Enables O(1) user lookup by Strava athlete ID

## Rationale

**stravaId as unique identifier:**
- Strava athlete ID is immutable and guaranteed unique
- Allows upsert operations during OAuth (find or create user)
- Enables linking all user data to their Strava identity

**Minimal user data:**
- Only store essential profile information
- No sensitive data (access tokens, email, etc.) stored in database
- Follows principle of data minimization for privacy

**Timestamps:**
- `createdAt` tracks when user first authenticated
- `updatedAt` tracks last login or profile update
- Useful for analytics and user lifecycle management

**Profile photo as optional:**
- Not all athletes have profile photos on Strava
- Allows graceful handling of missing photos in UI
