# Spec Requirements Document

> Spec: Training Plan Storage & Management
> Created: 2025-11-04
> Status: Planning

## Overview

Implement a backend system for storing and managing user training plans in CSV format with version history tracking. This feature enables the AI recommendation service to access historical training data and provides a foundation for data-driven coaching recommendations by combining stored plans with Strava activity data.

## User Stories

### Training Plan Upload via API

As a developer/tester, I want to upload a training plan via API endpoint, so that I can store a user's training regimen in the database for use by the AI recommendation service.

**Workflow:**
1. Developer makes POST request to `/api/training-plans` endpoint with user identification and CSV training plan data in request body
2. System validates CSV format to ensure it's parseable
3. System stores the training plan with comprehensive metadata (name, goal, race details, timestamps, status, source) but leaving any field empty if any information is not available.
4. System automatically creates a version entry in the version history collection
5. System returns success response with created training plan ID and metadata
6. Subsequent uploads create new versions while maintaining complete history

### AI Service Integration

As a backend service, I want to retrieve a user's active training plan from the database, so that I can combine it with Strava activities and pass it to the AI recommendation service.

**Workflow:**
1. API controller receives request for training recommendations
2. Controller fetches user's active training plan from database using user ID
3. Controller retrieves recent Strava activities for the user
4. Controller passes both the CSV training plan (as string) and activities to existing `generateRecommendations()` method
5. AI service processes the data with LLM-friendly CSV format
6. System returns AI-generated recommendations to the user

### Version History Tracking

As a system administrator, I want to maintain a complete history of training plan changes, so that I can track plan evolution, support rollback functionality, and analyze how AI recommendations influence plan modifications over time.

**Workflow:**
1. Every time a training plan is created or updated, system automatically creates a version entry
2. Version entry captures: full CSV content, metadata snapshot, timestamp, change type (created/updated/AI-modified)
3. System maintains chronological version history in separate collection
4. Future features can query version history to show plan evolution or enable rollback

## Spec Scope

1. **Training Plan Database Model** - Mongoose schema for storing training plans with CSV content, metadata fields (name, goal, race date/distance/target time, timestamps, active status, source attribution), and user relationship
2. **Training Plan Version Model** - Mongoose schema for version history with versioned CSV content, metadata snapshot, timestamps, change type, and parent plan reference
3. **POST API Endpoint** - REST endpoint at `/api/training-plans` accepting JSON body with user ID and CSV training plan, returning created plan with ID and metadata
4. **CSV Format Validation** - Validation logic to verify CSV is parseable and has valid structure before storage (reject malformed CSV)
5. **Version History Management** - Automatic version creation on plan creation/update, maintaining chronological history in separate collection

## Out of Scope

- Frontend UI components for training plan upload, display, or management
- CSV parsing into structured objects (plans stored as raw CSV text)
- Advanced CSV content validation (validating workout types, distances, paces, etc.)
- Plan editing or modification endpoints (only creation in this iteration)
- Automatic plan updates based on AI recommendations (manual process for now)
- GET/PUT/DELETE endpoints for training plan CRUD operations (focus on POST only)
- Authentication/authorization middleware (assume user ID is provided and valid)
- Frontend CSV display libraries or table components

## Expected Deliverable

1. **Testable via Postman** - Developer can POST a JSON body with `userId` and `trainingPlanCsv` fields to `/api/training-plans` endpoint and receive success response with created plan object including ID, metadata, and timestamps
2. **Database Persistence** - Posted training plans are persisted in MongoDB with proper Mongoose schema validation, and can be queried using MongoDB Compass or mongoose queries to verify storage
3. **Version History Created** - Each training plan upload automatically creates corresponding entry in TrainingPlanVersion collection, verifiable through database inspection showing version number, timestamp, and CSV snapshot

## Spec Documentation

- Tasks: @.agent-os/specs/2025-11-04-training-plan-storage/tasks.md
- Technical Specification: @.agent-os/specs/2025-11-04-training-plan-storage/sub-specs/technical-spec.md
