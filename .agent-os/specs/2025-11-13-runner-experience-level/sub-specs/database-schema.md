# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2025-11-13-runner-experience-level/spec.md

## Schema Changes

### User Collection Modification

Add new field to existing `users` collection:

```javascript
{
  // ... existing fields (email, name, stravaId, etc.)
  experienceLevel: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: false, // Optional initially to support existing users
    lowercase: true,
    trim: true,
    default: null
  },
  // ... rest of schema
}
```

### Mongoose Model Update

File: `apps/api/src/models/user.model.ts`

```typescript
import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name: string;
  stravaId: string;
  // ... other existing fields
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | null;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    stravaId: { type: String, required: true, unique: true },
    // ... other existing fields
    experienceLevel: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: false,
      lowercase: true,
      trim: true,
      default: null
    }
  },
  {
    timestamps: true
  }
);

export const User = model<IUser>('User', UserSchema);
```

## Migration Strategy

### No Migration Required

Since this is a new optional field with `default: null`:
- Existing user documents will automatically have `experienceLevel: null`
- No data migration script needed
- Users will set their level through the UI when ready

### Validation Rules

- **Enum constraint**: Only allows `'beginner'`, `'intermediate'`, `'advanced'`, or `null`
- **Case normalization**: `lowercase: true` ensures storage consistency
- **Whitespace handling**: `trim: true` prevents whitespace issues
- **Optional field**: `required: false` allows gradual adoption

## Indexes

No new indexes required. Queries will primarily use existing `_id` or `email` indexes for user lookups.

If future analytics require filtering/grouping by experience level:
```javascript
UserSchema.index({ experienceLevel: 1 }); // Optional index for reporting
```

## Data Integrity

- Field is validated at Mongoose model level via enum constraint
- Additional validation layer in API controller using Zod schema
- TypeScript types ensure compile-time type safety
- Database constraint prevents invalid values even if validation bypassed

## Rationale

**Why optional field?**
- Supports existing users without requiring immediate data population
- Allows phased rollout of feature
- Users can start using platform before setting experience level

**Why lowercase storage?**
- Ensures consistent storage format regardless of input casing
- Simplifies querying and comparison logic
- Frontend displays proper capitalization for UI

**Why enum constraint?**
- Enforces data integrity at database level
- Prevents typos or invalid values
- Makes data reliable for recommendation engine

**Why no separate Experience Level collection?**
- Experience level is tightly coupled to user identity
- Only 3 fixed values (not dynamic/expandable)
- Embedding improves query performance (no joins)
- Simplifies data model
