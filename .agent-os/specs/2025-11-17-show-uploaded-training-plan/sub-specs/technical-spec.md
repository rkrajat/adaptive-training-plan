# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-11-17-show-uploaded-training-plan/spec.md

## Technical Requirements

### Backend Changes

**File**: `apps/api/src/services/training-plan.service.ts`

- Modify the `getUserTrainingPlans` method to conditionally use `formatTrainingPlanWithContent` instead of `formatTrainingPlan` when `isActive` query parameter is true
- Ensure the response includes the `csvContent` field for active plans
- Line ~198-199 currently returns: `plans: trainingPlans.map((plan) => this.formatTrainingPlan(plan))`
- Change to conditionally map using `formatTrainingPlanWithContent` when filtering for active plans

**Type Update**: Ensure the API response type can handle `TrainingPlanWithContent` from `@adaptive-training-plan/types`

### Frontend Changes

**File**: `apps/web/app/dashboard/components/training-plan/training-plan-section.tsx`

- Update `TrainingPlanSectionProps` interface to accept `TrainingPlanWithContent` instead of `TrainingPlan`
- Import `TrainingPlanWithContent` type from `@adaptive-training-plan/types`
- Add conditional rendering: show table when `activePlan` exists, show upload section otherwise

**New Component**: `apps/web/app/dashboard/components/training-plan/training-plan-table.tsx`

- Accept `csvContent: string` and `currentWeek: number` as props
- Parse CSV content using a CSV parsing utility (see below)
- Use shadcn/ui Table component for rendering
- Use shadcn/ui Collapsible component for expandable week sections
- Group parsed rows by week number
- Render current week as expanded by default
- Render other weeks as collapsed with expand/collapse controls
- Apply responsive Tailwind CSS classes for mobile compatibility

**New Utility**: `apps/web/lib/utils/csv-parser.ts`

- Create a lightweight CSV parser function or use a library like `csv-parse` (browser version)
- Function signature: `parseCsvContent(csvContent: string): { headers: string[], rows: Record<string, string>[] }`
- Handle edge cases: empty content, malformed CSV
- Convert first row to headers (lowercase for consistency)
- Return structured data for table rendering

### Data Flow

1. Frontend queries: `GET /api/training-plans?isActive=true`
2. Backend returns `TrainingPlanWithContent` including `csvContent` string
3. Frontend receives response in `training-plan-section.tsx`
4. Pass `csvContent` and `currentWeek` to `TrainingPlanTable` component
5. `TrainingPlanTable` parses CSV content into headers and rows
6. Component groups rows by week number (assumes CSV has a "week" column)
7. Render using shadcn/ui Table and Collapsible components

### UI/UX Requirements

- Table must have clear headers derived from CSV column names
- Current week section is visually distinct (expanded by default)
- Collapsed weeks show week number and expand/collapse indicator
- Table cells display text with proper padding and borders (shadcn/ui defaults)
- Responsive design: table scrolls horizontally on small screens if needed
- Loading state while CSV is being parsed (if noticeable delay)

### Error Handling

- If `csvContent` is missing or malformed, display error message: "Unable to display training plan"
- If CSV parsing fails, log error to console and show fallback message
- If week number is missing from CSV, display all data in a single "Full Plan" section

### Performance Considerations

- CSV parsing should happen once on component mount, memoize the result
- Use React.memo for table rows if performance issues arise with large plans
- Limit initial render to current week + collapsed week headers (lazy render week content on expand)

## External Dependencies

No new external dependencies are required. All necessary tools are already in the tech stack:

- **shadcn/ui Table**: Already available in the `packages/ui` shared component library
- **shadcn/ui Collapsible**: Already available in the `packages/ui` shared component library
- **CSV Parsing**: Can use native JavaScript string methods or the existing `csv-parse` library already used in backend (`apps/api/package.json`)
