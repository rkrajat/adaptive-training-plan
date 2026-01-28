# Spec Tasks

## Tasks

- [x] 1. Implement Training Status AI Service
  - [x] 1.1 Add `buildStatusSystemPrompt()` method to ai.service.ts with focused status assessment prompt
  - [x] 1.2 Add `buildStatusUserPrompt()` method to format training plan, activities, and context
  - [x] 1.3 Add `generateTrainingStatus()` method with JSON response parsing and validation

- [x] 2. Create Training Status API Endpoint
  - [x] 2.1 Create training-status.controller.ts with eligibility checks and status generation logic (use `getCurrentWeekNumber` from @adaptive-training-plan/utils)
  - [x] 2.2 Create training-status.ts routes file with POST /training-status route
  - [x] 2.3 Register route in main routes index
  - [x] 2.4 Add Zod schema for response validation

- [x] 3. Build Training Status Banner Component
  - [x] 3.1 Create TrainingStatusBanner component with status display, icons, and color coding
  - [x] 3.2 Create types.ts with TrainingStatus types and interfaces
  - [x] 3.3 Create constants.ts with status display mappings (colors, icons, text)
  - [x] 3.4 Add component exports to index.ts

- [x] 4. Integrate Status Banner with Dashboard
  - [x] 4.1 Create useTrainingStatus custom hook with TanStack Query (1-hour stale time)
  - [x] 4.2 Add TrainingStatusBanner to dashboard page at top position
  - [x] 4.3 Implement conditional rendering logic (only show when eligible)
