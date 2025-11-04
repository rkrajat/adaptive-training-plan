# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-11-04-training-plan-storage/spec.md

> Created: 2025-11-04
> Status: Ready for Implementation

## Tasks

- [ ] 1. Database Layer - Training Plan Models
  - [ ] 1.1 Implement TrainingPlan schema with required fields (name, userId, currentVersionId, createdAt, updatedAt)
  - [ ] 1.2 Implement TrainingPlanVersion schema with required fields (planId, versionNumber, weeksData, uploadedAt, metadata)
  - [ ] 1.3 Add compound indexes for userId queries and version lookups
  - [ ] 1.4 Add schema pre-save hooks for timestamp management
  - [ ] 1.5 Create type definitions for TrainingPlan and TrainingPlanVersion documents

- [ ] 2. Service Layer - Training Plan Business Logic
  - [ ] 2.1 Implement CSV parser utility to convert CSV buffer to structured weeks data
  - [ ] 2.2 Implement CSV validator to verify structure, data types, and business rules
  - [ ] 2.3 Implement createTrainingPlan service method (create plan + initial version, handle transactions)
  - [ ] 2.4 Implement getTrainingPlan, getUserTrainingPlans, and getTrainingPlanWithVersions service methods

- [ ] 3. API Layer - Training Plan Upload Endpoints
  - [ ] 3.1 Implement Zod validation schemas for training plan upload request (name, file validation)
  - [ ] 3.2 Implement Zod validation schemas for training plan response DTOs
  - [ ] 3.3 Implement training plan controller with  CSV file upload functionality
  - [ ] 3.4 Implement controller methods for create, getById, listByUser, and getWithVersions
  - [ ] 3.5 Add Express routes for POST /api/training-plans and GET /api/training-plans endpoints
  - [ ] 3.6 Add authentication middleware to protect training plan routes

- [ ] 4. AI Integration - Update Recommendation Flow
  - [ ] 4.1 Update recommendation service to fetch training plan from database instead of request body
  - [ ] 4.2 Implement training plan data formatter for AI prompt context
  - [ ] 4.3 Update recommendation controller to accept planId parameter instead of plan data
  - [ ] 4.4 Add validation to ensure user owns the training plan before generating recommendations
  - [ ] 4.5 Update API documentation to reflect new recommendation flow
