# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2026-01-15-weekly-runs-report/spec.md

## Technical Requirements

### Component Architecture

- **WeeklyRunsReport Component** - A React functional component using TypeScript that displays the weekly summary card
- **useWeeklyRunsReport Hook** - Custom TanStack Query hook to fetch and cache weekly activity data
- **Weekly Stats Calculation** - Utility functions to aggregate activity metrics for a given week

### UI/UX Specifications

- Card-based design using shadcn/ui Card component
- Responsive grid layout showing 5 key metrics: Total Distance, Number of Runs, Average Pace, Total Time, Longest Run
- Loading skeleton state while data is being fetched
- Empty state when no runs exist for the current week
- Consistent styling with existing dashboard components (orange accent for current week theme)

### Data Requirements

- Fetch Strava activities that fall within the current training week date range
- Calculate week boundaries based on training plan start date and current week number
- Aggregate metrics:
  - **Total Distance**: Sum of all activity distances (display in km)
  - **Number of Runs**: Count of run-type activities
  - **Average Pace**: Total time / total distance (display as min/km)
  - **Total Time**: Sum of all activity moving times (display as hours:minutes)
  - **Longest Run**: Maximum distance from a single activity (display in km)

### Integration Points

- Integrate with existing dashboard page layout (apps/web/app/dashboard/)
- Use existing Strava activity data from the API
- Leverage currentWeek and startDate props pattern from TrainingPlanTable component
- Follow existing TanStack Query patterns for data fetching

### Performance Criteria

- Initial load time under 500ms for cached data
- Skeleton loading state renders immediately
- Data automatically refetches when user returns to the dashboard tab

### Error Handling

- Display user-friendly error message if Strava data fetch fails
- Graceful degradation: show empty state rather than breaking the dashboard
- Retry mechanism via TanStack Query defaults

## Component Props Interface

```typescript
interface WeeklyRunsReportProps {
  currentWeek: number;
  startDate: string; // ISO date string
}

interface WeeklyRunsData {
  totalDistance: number; // in meters
  numberOfRuns: number;
  averagePace: number; // seconds per km
  totalTime: number; // in seconds
  longestRun: number; // in meters
  weekStartDate: string;
  weekEndDate: string;
}
```

## File Structure

```
apps/web/app/dashboard/
├── components/
│   └── weekly-runs-report/
│       ├── index.ts
│       ├── WeeklyRunsReport.tsx
│       ├── WeeklyRunsReportSkeleton.tsx
│       └── types.ts
├── hooks/
│   └── useWeeklyRunsReport.ts
```
