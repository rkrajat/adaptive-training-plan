# Spec Tasks

## Tasks

- [x] 1. Create shared TypeScript types (packages/types)
  - [x] 1.1 Create RaceGoal, PaceRange, TrainingPaces types in packages/types
  - [x] 1.2 Create race distance constants and validation bounds
  - [x] 1.3 Export types from packages/types index

- [x] 2. Implement VDOT calculation service (Backend)
  - [x] 2.1 Create VDOT service with Daniels' formula implementation
  - [x] 2.2 Implement training pace derivation from VDOT (all 6 zones)
  - [x] 2.3 Add pace formatting utility (seconds to mm:ss /km)

- [x] 3. Update User schema and Zod validators (Backend)
  - [x] 3.1 Import shared types from packages/types
  - [x] 3.2 Add raceGoal field to User Mongoose schema
  - [x] 3.3 Create Zod validation schemas for race goal input

- [x] 4. Implement race goal API endpoints (Backend)
  - [x] 4.1 Modify POST /api/training-plan to accept and validate race goal
  - [x] 4.2 Implement GET /api/user/paces endpoint
  - [x] 4.3 Implement PUT /api/user/race-goal endpoint

- [x] 5. Build race goal form components (Frontend)
  - [x] 5.1 Import shared types from packages/types
  - [x] 5.2 Create RaceDistanceSelect component with 4 distance options
  - [x] 5.3 Create TimeTargetInput component (hh:mm:ss dropdowns)
  - [x] 5.4 Add time validation logic with world record minimums
  - [x] 5.5 Integrate components into training plan upload form

- [x] 6. Integrate paces into AI recommendations (Backend)
  - [x] 6.1 Modify recommendation service to check for plan-embedded paces
  - [x] 6.2 Update AI prompt template to include training paces
  - [x] 6.3 Implement fallback logic (calculated paces when plan lacks them)
