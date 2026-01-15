# Spec Requirements Document

> Spec: Weekly Runs Report
> Created: 2026-01-15

## Overview

Implement a weekly runs report summary component that displays aggregated Strava activity data for the current training week at the top of the dashboard. This feature provides runners with at-a-glance visibility into their weekly training progress to help them understand their actual performance against their training plan.

## User Stories

### View Weekly Running Summary

As a runner, I want to see a summary of my runs for the current training week, so that I can quickly understand my training volume and progress without navigating to Strava.

When I open the dashboard, I see a prominent card at the top showing my weekly running statistics including total distance, number of runs, average pace, total time, and my longest run. The data automatically reflects the current week of my training plan and updates as I sync new activities from Strava.

### Quick Performance Check

As a runner preparing for my next workout, I want to see my recent activity summary, so that I can make informed decisions about today's training intensity.

Before starting my workout, I check the weekly report to see how much I've already run this week. This helps me decide if I should push harder or take it easier based on my accumulated training load.

## Spec Scope

1. **Weekly Stats Card** - A summary card component displaying key running metrics for the current training week
2. **Strava Data Integration** - Fetch and aggregate activity data from synced Strava activities for the current week
3. **Dashboard Placement** - Position the weekly report prominently above the training plan table
4. **Automatic Week Calculation** - Determine which activities belong to the current training week based on the plan's start date

## Out of Scope

- Historical week navigation (viewing past weeks' reports)
- Comparison to planned training volume
- Heart rate zone analysis
- Sleep data integration
- Export or sharing functionality
- Mobile-specific responsive optimizations beyond basic responsiveness

## Expected Deliverable

1. A weekly runs report card is visible at the top of the dashboard page showing: total distance (km/miles), number of runs, average pace, total time, and longest run
2. The report automatically displays data for the current training week based on the training plan's start date
3. The component gracefully handles empty states when no runs exist for the current week
