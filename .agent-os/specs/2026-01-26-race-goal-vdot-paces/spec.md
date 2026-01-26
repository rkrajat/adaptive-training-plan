# Spec Requirements Document

> Spec: Race Goal & VDOT-Based Training Paces
> Created: 2026-01-26

## Overview

Implement mandatory race goal selection (distance + target time) in the training plan upload form, with backend VDOT calculation to derive personalized training paces (Easy, Long Run, Marathon, Threshold, Interval, Repetition) that enhance AI-powered recommendations.

## User Stories

### Setting a Race Goal During Plan Upload

As a runner uploading my training plan, I want to specify my target race distance and finish time, so that the system can calculate appropriate training paces tailored to my fitness level.

The user opens the training plan upload form and sees two new mandatory fields:
1. **Race Distance** - A dropdown with options: 5K, 10K, Half Marathon, Marathon
2. **Time Target** - Three combo dropdowns for hours (hh), minutes (mm), and seconds (ss)

The time dropdowns validate against realistic minimums based on the selected distance (using world record times as absolute floors). Upon form submission, the backend calculates the user's VDOT score and derives six training pace zones that are stored with the user profile.

### Receiving Pace-Informed Recommendations

As a runner requesting weekly training recommendations, I want the AI to consider appropriate training paces, so that my recommended workouts match my current fitness level.

When generating recommendations:
1. If the uploaded training plan contains pace information, the AI prioritizes those paces
2. If the plan lacks paces, the system falls back to the calculated VDOT-derived paces
3. The AI uses these paces to suggest appropriate intensities for different workout types

## Spec Scope

1. **Race Distance Dropdown** - Add mandatory dropdown with 5K, 10K, Half Marathon, Marathon options to training plan upload form
2. **Time Target Input** - Add three-part hh:mm:ss dropdown selector with validation against world-record minimums per distance
3. **Backend VDOT Calculation** - Implement Daniels' VDOT formula to calculate fitness score from race distance and target time
4. **Training Pace Derivation** - Calculate six training zones (Easy/Recovery, Long Run, Marathon, Threshold, Interval, Repetition) as pace ranges
5. **Pace Storage** - Store calculated VDOT and paces embedded in User document
6. **Recommendation Enhancement** - Modify AI prompt to incorporate paces (plan paces prioritized, calculated paces as fallback)

## Out of Scope

- Pace unit preference (km vs miles) - will use min/km only for v1
- Historical VDOT tracking over time
- Manual pace override by user
- Pace visualization/display in UI (only storage and AI consumption)
- Integration with other running calculators or external VDOT services

## Expected Deliverable

1. Training plan upload form requires race distance and time target selection before submission, with appropriate validation errors displayed for invalid times
2. Upon successful plan upload, user document contains calculated VDOT score and six training pace zones
3. AI recommendations incorporate pace information when generating weekly training suggestions
