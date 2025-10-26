# Spec Requirements Document

> Spec: Strava OAuth Integration
> Created: 2025-10-26

## Overview

Implement Strava OAuth authentication to allow users to securely log in using their Strava accounts and access their recent activity data. This feature will serve as the foundation for the platform's core functionality by establishing user authentication and enabling data retrieval from Strava's API.

## User Stories

### Runner Login Flow

As a runner, I want to log in with my Strava account, so that the platform can access my training data and provide personalized recommendations.

**Workflow:** User visits the login page, clicks "Login with Strava" button, is redirected to Strava's OAuth authorization page, grants permissions, and is redirected back to the application dashboard with authentication established. The system creates a user record, issues a JWT token, and fetches the user's profile information and last 30 days of activities.

### Dashboard Access

As an authenticated user, I want to see my recent Strava activities on my dashboard, so that I can verify the platform is correctly accessing my data.

**Workflow:** After successful login, user lands on the dashboard page which displays their profile information (name, photo) and a list of their recent activities from the past 30 days including distance, duration, and activity type.

## Spec Scope

1. **Login Page** - Create a login page with "Login with Strava" button that initiates OAuth flow
2. **Backend OAuth Integration** - Implement Strava OAuth flow using node-strava-v3 library with authorization and callback endpoints
3. **JWT Authentication** - Issue JWT tokens after successful Strava authentication for stateless session management
4. **User Model** - Create MongoDB schema to store user profile data and Strava athlete information
5. **Dashboard Page** - Create a dashboard page that displays user profile and fetches recent activities from Strava

## Out of Scope

- Persistent storage of Strava access tokens (tokens stored in session only)
- Activity data caching in database (real-time fetching only)
- Logout functionality
- Token refresh mechanism
- Error handling for expired Strava tokens
- Multi-provider authentication (Google, Facebook, etc.)

## Expected Deliverable

1. User can click "Login with Strava" button and complete OAuth flow successfully
2. After login, user sees their profile information and last 30 days of activities on the dashboard
3. JWT token is issued and used for subsequent authenticated API requests
