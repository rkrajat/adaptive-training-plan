# Database Schema

This is the database schema implementation for the spec detailed in @.agent-os/specs/2026-01-26-race-goal-vdot-paces/spec.md

## Schema Changes

### User Document - New Fields

Add the following fields to the existing User schema (Mongoose):

```typescript
// apps/api/src/models/User.ts

interface PaceRange {
  minPace: number;  // seconds per km (slower pace)
  maxPace: number;  // seconds per km (faster pace)
}

interface TrainingPaces {
  easy: PaceRange;
  longRun: PaceRange;
  marathon: PaceRange;
  threshold: PaceRange;
  interval: PaceRange;
  repetition: PaceRange;
}

interface RaceGoal {
  distance: number;           // meters (5000, 10000, 21097.5, 42195)
  distanceLabel: string;      // "5K" | "10K" | "Half Marathon" | "Marathon"
  targetTimeSeconds: number;  // total seconds
  vdot: number;               // calculated VDOT score
  paces: TrainingPaces;       // derived training zones
  calculatedAt: Date;         // timestamp of calculation
}

// Add to User schema
{
  // ... existing fields
  raceGoal: {
    type: {
      distance: { type: Number, required: true },
      distanceLabel: { type: String, required: true },
      targetTimeSeconds: { type: Number, required: true },
      vdot: { type: Number, required: true },
      paces: {
        easy: {
          minPace: { type: Number, required: true },
          maxPace: { type: Number, required: true }
        },
        longRun: {
          minPace: { type: Number, required: true },
          maxPace: { type: Number, required: true }
        },
        marathon: {
          minPace: { type: Number, required: true },
          maxPace: { type: Number, required: true }
        },
        threshold: {
          minPace: { type: Number, required: true },
          maxPace: { type: Number, required: true }
        },
        interval: {
          minPace: { type: Number, required: true },
          maxPace: { type: Number, required: true }
        },
        repetition: {
          minPace: { type: Number, required: true },
          maxPace: { type: Number, required: true }
        }
      },
      calculatedAt: { type: Date, required: true }
    },
    required: false,  // Optional until plan is uploaded
    default: null
  }
}
```

## Rationale

### Embedded vs Separate Collection

**Decision: Embed in User document**

1. **Access Pattern** - Paces are always fetched with user data for recommendations
2. **Atomic Updates** - Race goal and paces update together when user changes target
3. **Query Simplicity** - Single query retrieves all needed data
4. **Data Size** - Paces object is small (~200 bytes), well within embedding limits
5. **No Independent Access** - Paces are never queried without user context

### Field Design Choices

| Field | Type | Rationale |
|-------|------|-----------|
| `distance` | Number | Meters for precise calculations |
| `distanceLabel` | String | Human-readable for display |
| `targetTimeSeconds` | Number | Seconds for calculation simplicity |
| `vdot` | Number | Cached to avoid recalculation |
| `paces.*` | PaceRange | Min/max captures zone ranges |
| `calculatedAt` | Date | Track when paces were computed |

### Pace Storage Format

- **Seconds per kilometer** chosen over:
  - `mm:ss` string - loses precision, harder to compare
  - Meters per second - less intuitive for runners
  - Minutes per km float - rounding issues

### Index Considerations

No new indexes required:
- `raceGoal` is only accessed via User document lookup
- No queries filter or sort by VDOT or paces
- User lookup remains by `_id` or `stravaId` (existing indexes)

## Migration Notes

- Existing users will have `raceGoal: null`
- No backfill needed - field populated when user uploads training plan
- Schema is backward compatible (new optional field)
