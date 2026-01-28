# Spec Requirements Document

> Spec: Training Status Indicator
> Created: 2026-01-28

## Overview

Implement an AI-powered training status indicator that appears prominently at the top of the dashboard, providing users with an immediate visual assessment of whether their training is on track, along with a brief explanation of the rationale. This feature enables runners to quickly understand their training adherence and make informed decisions about their upcoming workouts.

## User Stories

### Instant Training Health Check

As a runner using the platform, I want to see a clear status indicator the moment I land on my dashboard, so that I can immediately understand if my training is progressing as planned.

When I log in, the first thing I see is a prominent status banner at the top of the dashboard. The status shows one of three states: "On Track", "Slightly Off Track", or "Off Track", with a color-coded visual indicator (green, yellow, red). Below the status, I see 1-2 sentences explaining why the AI determined this status, such as "You've completed 85% of your planned mileage this week with consistent pacing" or "Your long run was missed and recovery runs are shorter than planned."

### Understanding My Training Trajectory

As a runner following a multi-week training plan, I want to understand how my recent performance compares to my plan expectations, so that I can adjust my effort or expectations accordingly.

The status indicator analyzes my last two weeks of Strava activities against my training plan, considering my current week number in the plan and my running experience level. The AI provides context-aware feedback that accounts for whether I'm in week 2 or week 10 of my plan, adjusting expectations appropriately.

## Spec Scope

1. **Dashboard Status Banner Component** - A prominent, color-coded status indicator positioned at the top of the dashboard showing training status (On Track / Slightly Off Track / Off Track) with accompanying explanation text.

2. **Training Status API Endpoint** - A new API endpoint that accepts user context and returns the LLM-generated training status with rationale.

3. **LLM Prompt Engineering** - A focused system prompt and user prompt structure specifically designed for accurate status determination with 90%+ confidence requirements.

4. **Week Calculation Logic** - Backend logic to calculate the current training week based on plan start date and determine eligibility (week 2+ only).

5. **Status Display Logic** - Frontend logic to conditionally show the status indicator only when applicable (user has active plan, is in week 2+, has recent activities).

## Out of Scope

- Detailed breakdown of what specific workouts were missed or completed
- Historical status tracking or status history view
- Push notifications or email alerts based on status changes
- Recommendations for how to get back on track (existing recommendation feature handles this)
- Status indicator for users in their first week of training
- Custom status thresholds or user-configurable sensitivity

## Expected Deliverable

1. A prominent status banner visible at the top of the dashboard that displays one of three statuses (On Track, Slightly Off Track, Off Track) with appropriate color coding and a 1-2 sentence explanation, loading only for users in week 2+ of their training plan.

2. An API endpoint `/api/training-status` that returns the training status and rationale based on LLM analysis of user's training plan, recent activities, current week, and experience level.

3. The status indicator correctly handles edge cases: shows loading state while fetching, shows nothing for users without active plans or in week 1, and shows appropriate error state if analysis fails.
