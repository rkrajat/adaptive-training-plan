# Spec Requirements Document

> Spec: Show Uploaded Training Plan in Table
> Created: 2025-11-17

## Overview

Display the user's uploaded training plan in a tabular format on the Dashboard when an active plan exists, with the current week prominently displayed and other weeks accessible via expandable sections. This enhances user visibility into their training schedule and provides easy reference to their uploaded plan details.

## User Stories

### View Current Week Training Details

As a runner with an uploaded training plan, I want to see my current week's training schedule displayed in a table format, so that I can quickly reference my planned workouts for the week.

When a user navigates to the Dashboard and has an active training plan, the system displays the current week's training data in a table with columns based on the CSV structure (e.g., day, workout type, distance, pace, notes). The current week is calculated based on the plan's start date and today's date. The user can easily scan the table to understand their training schedule without needing to download or open the original CSV file.

### Explore Other Weeks in Training Plan

As a runner, I want to view other weeks in my training plan beyond the current week, so that I can plan ahead or review past weeks.

The table component includes expandable sections for all weeks in the training plan. The current week is expanded by default, while other weeks are collapsed. Users can click to expand any week to view its training details in the same tabular format. This allows users to explore their entire training plan without cluttering the interface.

### Understand Plan Status

As a runner, I want to clearly see when I have an active training plan versus when I need to upload one, so that I know what action to take.

When no active training plan exists, the upload section is displayed with clear instructions to upload a CSV file. When an active plan is present, the upload section is hidden and replaced with the training plan table display. This conditional rendering ensures users always know their current plan status and next steps.

## Spec Scope

1. **Backend API Enhancement** - Modify GET /training-plans endpoint to include csvContent field in response when querying for active plans
2. **CSV Content Parsing** - Parse the raw CSV string content on the frontend to extract headers and row data for table rendering
3. **Dynamic Table Component** - Create a responsive table component using shadcn/ui Table that dynamically renders columns based on CSV headers
4. **Current Week Display** - Calculate and display the current week based on plan start date, showing it expanded by default in the table
5. **Expandable Week Sections** - Implement collapsible/expandable sections for each week of the training plan using shadcn/ui Collapsible component

## Out of Scope

- Editing or modifying training plan data inline
- Sorting, filtering, or searching within the table
- Pagination for large training plans
- Export functionality for the displayed plan
- Mobile-specific table optimizations (basic responsive design only)
- Week completion tracking or progress indicators

## Expected Deliverable

1. When a user with an active training plan views the Dashboard, the current week's training data displays in a table with all CSV columns visible
2. Users can expand/collapse other weeks in their training plan to view past or future training schedules
3. When no active plan exists, the upload training plan section displays instead of the table
