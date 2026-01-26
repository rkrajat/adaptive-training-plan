# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2026-01-26-race-goal-vdot-paces/spec.md

## Technical Requirements

### Frontend (Next.js)

#### Race Distance Dropdown
- Chakra UI `Select` component with options:
  - `5K` (value: 5000)
  - `10K` (value: 10000)
  - `Half Marathon` (value: 21097.5)
  - `Marathon` (value: 42195)
- Field marked as required with Zod validation
- Store distance in meters for backend calculations

#### Time Target Selector
- Three Chakra UI `Select` dropdowns side by side:
  - Hours (hh): 0-6 range
  - Minutes (mm): 0-59 range
  - Seconds (ss): 0-59 range
- Default all to "00"
- Combine into total seconds for submission

#### Time Validation Rules (World Record Minimums)
| Distance | Minimum Time | Rationale |
|----------|-------------|-----------|
| 5K | 12:35 (755s) | Men's WR ~12:35 |
| 10K | 26:11 (1571s) | Men's WR ~26:11 |
| Half Marathon | 57:30 (3450s) | Men's WR ~57:31 |
| Marathon | 2:00:35 (7235s) | Men's WR ~2:00:35 |

#### Maximum Time Bounds (Reasonable Upper Limits)
| Distance | Maximum Time | Rationale |
|----------|-------------|-----------|
| 5K | 1:00:00 (3600s) | Walking pace cutoff |
| 10K | 2:00:00 (7200s) | Walking pace cutoff |
| Half Marathon | 4:00:00 (14400s) | Typical race cutoff |
| Marathon | 7:00:00 (25200s) | Typical race cutoff |

#### Validation Error Messages
- Below minimum: "Time is faster than the world record for {distance}. Please enter a realistic target."
- Above maximum: "Time exceeds typical race cutoff for {distance}. Please enter a realistic target."
- Zero time: "Please enter a target finish time."

### Backend (Express.js)

#### VDOT Calculation Service

```typescript
// Input normalization
const velocityMps = distanceMeters / timeSeconds;
const velocityMpm = velocityMps * 60; // meters per minute

// VO2 cost of running at velocity
const vo2 = -4.60 + (0.182258 * velocityMpm) + (0.000104 * velocityMpm * velocityMpm);

// Fraction of VO2max sustained
const timeMinutes = timeSeconds / 60;
const fraction = 0.8
  + (0.1894393 * Math.exp(-0.012778 * timeMinutes))
  + (0.2989558 * Math.exp(-0.1932605 * timeMinutes));

// VDOT calculation
const vdot = vo2 / fraction;
```

#### Training Pace Derivation

For each zone, solve quadratic to find velocity at target VO2 percentage:

```typescript
// targetVO2 = vdot * percentage
// Solve: 0.000104v² + 0.182258v - (targetVO2 + 4.6) = 0

const a = 0.000104;
const b = 0.182258;
const c = -(targetVO2 + 4.6);
const velocityMpm = (-b + Math.sqrt(b*b - 4*a*c)) / (2*a);

// Convert to pace (seconds per km)
const velocityMps = velocityMpm / 60;
const paceSecPerKm = 1000 / velocityMps;
```

#### Training Zone Percentages
| Zone | Min % | Max % | Notes |
|------|-------|-------|-------|
| Easy/Recovery | 0.59 | 0.74 | Most training volume |
| Long Run | 0.65 | 0.78 | Endurance building |
| Marathon | 0.80 | 0.84 | Race-specific (if marathon-trained) |
| Threshold | 0.88 | 0.92 | ~60 min race effort |
| Interval | 0.97 | 1.00 | 3-5 min repetitions |
| Repetition | 1.03 | 1.07 | Short, fast reps |

#### Pace Output Format
- Store as seconds per kilometer (integer)
- Each zone has `minPace` and `maxPace` (range)
- Format for display: `mm:ss /km`

### AI Recommendation Integration

#### Pace Priority Logic
1. Check if uploaded training plan contains pace definitions
2. If plan has paces → use plan paces (higher priority)
3. If plan lacks paces → use calculated VDOT paces (fallback)

#### Prompt Enhancement
Add to recommendation prompt:
```
Training Paces for this athlete:
- Easy/Recovery: {easyMin} - {easyMax} /km
- Long Run: {longRunMin} - {longRunMax} /km
- Marathon Pace: {marathonMin} - {marathonMax} /km
- Threshold: {thresholdMin} - {thresholdMax} /km
- Interval: {intervalMin} - {intervalMax} /km
- Repetition: {repMin} - {repMax} /km

Note: If the training plan specifies different paces, prioritize those over the calculated paces above.
```

## Implementation Notes

- Keep all intermediate calculations as floats; only round at final formatting
- Cache VDOT once per user; recalculate only when race goal changes
- Validate that time is reasonable for distance (no 5K in 5 hours, etc.)
- Flag marathon pace zone only if target distance is Half Marathon or Marathon
