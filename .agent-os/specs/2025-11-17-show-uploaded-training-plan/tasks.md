# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-11-17-show-uploaded-training-plan/spec.md

> Created: 2025-11-17
> Status: Ready for Implementation


## Tasks

- [ ] 1. Backend API Enhancement

  - [ ] 1.1 Modify getUserTrainingPlans method in training-plan.service.ts to conditionally use formatTrainingPlanWithContent
  - [ ] 1.2 Update response type handling to support TrainingPlanWithContent

- [ ] 2. CSV Parsing Utility

  - [ ] 2.1 Create csv-parser.ts utility in apps/web/lib/utils/
  - [ ] 2.2 Implement parseCsvContent function to extract headers and rows
  - [ ] 2.3 Handle edge cases (empty content, malformed CSV, missing week column)

- [ ] 3. Training Plan Table Component

  - [ ] 3.1 Create training-plan-table.tsx component using shadcn/ui Table and Collapsible
  - [ ] 3.2 Implement CSV content parsing and week grouping logic
  - [ ] 3.3 Render table headers dynamically from CSV columns
  - [ ] 3.4 Implement expandable sections with current week expanded by default
  - [ ] 3.5 Add responsive styling with Tailwind CSS
  - [ ] 3.6 Implement error handling for missing or malformed CSV content

- [ ] 4. Integration with Training Plan Section
  - [ ] 4.1 Update TrainingPlanSectionProps to accept TrainingPlanWithContent type
  - [ ] 4.2 Add conditional rendering logic (table when plan exists, upload section otherwise)
  - [ ] 4.3 Integrate TrainingPlanTable component with activePlan data

## Acceptance Criteria

The implementation will be considered complete when ALL of the following criteria are met:

### Functional Requirements

- [ ] **AC1**: When a user with an active training plan navigates to the Dashboard, the training plan displays in a table format with all CSV columns visible
- [ ] **AC2**: The current week section is expanded by default and visually prominent in the table display
- [ ] **AC3**: Other weeks (past and future) are collapsed by default with visible expand/collapse controls
- [ ] **AC4**: Users can click to expand any collapsed week section to view its training data in the same table format
- [ ] **AC5**: When no active training plan exists, the upload training plan section displays instead of the table
- [ ] **AC6**: The table dynamically renders columns based on the CSV headers (supports any CSV structure)
- [ ] **AC7**: The GET /training-plans API includes csvContent field in the response when isActive=true query parameter is present

### Technical Requirements

- [ ] **AC8**: Backend uses formatTrainingPlanWithContent for active plan queries while maintaining backward compatibility
- [ ] **AC9**: CSV parsing handles edge cases gracefully (empty content, malformed CSV, missing week column) with appropriate error messages
- [ ] **AC10**: Table component uses shadcn/ui Table and Collapsible components (no custom UI components)
- [ ] **AC11**: All TypeScript code passes strict mode compilation with no 'any' types
- [ ] **AC12**: Component uses named exports only (no default exports)
- [ ] **AC13**: All functions use arrow function syntax

### UI/UX Requirements

- [ ] **AC14**: Table displays with proper spacing, borders, and readable typography using shadcn/ui defaults
- [ ] **AC15**: Table is responsive and usable on mobile devices (horizontal scroll if needed)
- [ ] **AC16**: Loading states are handled appropriately during data fetching
- [ ] **AC17**: Error states display clear user-friendly messages when CSV content is missing or malformed

### Code Quality Requirements

- [ ] **AC18**: Code follows project naming conventions (kebab-case files, PascalCase components, camelCase variables)
- [ ] **AC19**: Import order follows ESLint rules (React, external, type imports, internal, relative)
- [ ] **AC20**: All new code is formatted with Prettier
- [ ] **AC22**: No ESLint errors or warnings in modified files