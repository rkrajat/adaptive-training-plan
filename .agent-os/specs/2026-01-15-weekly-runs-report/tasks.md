# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2026-01-15-weekly-runs-report/spec.md

> Created: 2026-01-15
> Status: Ready for Implementation

## Tasks

- [ ] 1. Implement Backend API Endpoint for Weekly Summary
  - [ ] 1.1 Create Zod validation schema for query parameters (startDate, week)
  - [ ] 1.2 Implement week boundary calculation utility (startDate + week number → date range)
  - [ ] 1.3 Create weekly activity aggregation service (filter runs, sum metrics, calculate pace)
  - [ ] 1.4 Implement GET /api/activities/weekly-summary route and controller

- [ ] 2. Create Shared Types for Weekly Runs Data
  - [ ] 2.1 Add WeeklyRunsData interface to @adaptive-training-plan/types package
  - [ ] 2.2 Add API response types for weekly summary endpoint
  - [ ] 2.3 Export types from package index

- [ ] 3. Implement Frontend WeeklyRunsReport Component
  - [ ] 3.1 Create types.ts with component prop interfaces
  - [ ] 3.2 Create WeeklyRunsReportSkeleton.tsx loading state component
  - [ ] 3.3 Create WeeklyRunsReport.tsx main component with shadcn/ui Card and metric grid
  - [ ] 3.4 Implement metric formatting utilities (distance to km, pace to min/km, time to hours:minutes)
  - [ ] 3.5 Create index.ts with named exports

- [ ] 4. Implement useWeeklyRunsReport Data Fetching Hook
  - [ ] 4.1 Create useWeeklyRunsReport.ts with TanStack Query implementation
  - [ ] 4.2 Configure query caching and refetch behavior

- [ ] 5. Integrate WeeklyRunsReport into Dashboard Page
  - [ ] 5.1 Import and position WeeklyRunsReport above TrainingPlanTable in dashboard
  - [ ] 5.2 Pass currentWeek and startDate props to WeeklyRunsReport
