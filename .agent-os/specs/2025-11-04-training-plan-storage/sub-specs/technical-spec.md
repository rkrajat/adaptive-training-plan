# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-11-04-training-plan-storage/spec.md

> Created: 2025-11-04
> Version: 1.0.0

## Technical Requirements

### File Organization

**Model Files:**
- `apps/api/src/models/TrainingPlan.ts` - Mongoose schema for training plans
- `apps/api/src/models/TrainingPlanVersion.ts` - Mongoose schema for version history

**Service Files:**
- `apps/api/src/services/training-plan.service.ts` - Business logic for training plan operations (validation, version creation, CRUD operations)

**Route/Controller Files:**
- `apps/api/src/routes/training-plan.routes.ts` - Express route definitions
- `apps/api/src/controllers/training-plan.controller.ts` - Request/response handling and service orchestration

**Validator Files:**
- `apps/api/src/validators/training-plan.validator.ts` - CSV format validation logic using Zod schemas

### CSV Storage Format

- Store CSV content as raw string in MongoDB text field
- Preserve original formatting, line breaks, and delimiters
- No parsing or transformation - maintain LLM-friendly format
- Validate parseability using CSV parsing library (e.g., `csv-parse` or `papaparse`) but don't store parsed result

### Validation Requirements

**CSV Format Validation:**
1. Verify string is not empty
2. Attempt to parse CSV to verify it's valid CSV format
3. Check that CSV has at least one row of data (beyond headers if present)
4. Reject if parsing throws error
5. No content validation - accept any valid CSV structure

**Request Validation (using Zod):**
- `userId` - required, must be valid MongoDB ObjectId or Strava ID
- `trainingPlanCsv` - required string, minimum 10 characters
- `metadata` object with optional fields:
  - `name` - optional string
  - `goal` - optional string
  - `raceName` - optional string
  - `raceDate` - optional ISO date string
  - `raceDistance` - optional string (e.g., "5K", "marathon")
  - `targetTime` - optional string (e.g., "3:30:00")
  - `source` - optional enum: "manual_upload" | "coach_provided" | "ai_generated" | "other"

### Version History Logic

**Automatic Version Creation:**
1. On training plan POST, after saving TrainingPlan document:
   - Create TrainingPlanVersion document
   - Set `trainingPlanId` to reference parent plan
   - Copy full CSV content to version
   - Copy all metadata fields to version
   - Set `versionNumber` by counting existing versions + 1
   - Set `changeType` to "created" for new plans
   - Set `createdAt` timestamp

2. Version number calculation:
   - Query `TrainingPlanVersion.countDocuments({ trainingPlanId })`
   - New version number = count + 1

### API Integration Pattern

**Controller Responsibility:**
1. Receive request with userId and CSV data
2. Validate request using Zod validator
3. Call `trainingPlanService.createTrainingPlan(data)`
4. Service handles database operations and version creation
5. Return response with created plan object

**AI Service Integration (No changes to AI service):**
1. Recommendation controller fetches training plan: `trainingPlanService.getActiveTrainingPlan(userId)`
2. Extract CSV string from returned document: `trainingPlan.csvContent`
3. Pass CSV string to existing `aiService.generateRecommendations(activities, csvContent, feedback)`
4. AI service receives CSV as string parameter (unchanged contract)

### Error Handling

**Validation Errors (400 Bad Request):**
- Invalid CSV format (unparseable)
- Missing required fields (userId, trainingPlanCsv)
- Invalid userId format

**Database Errors (500 Internal Server Error):**
- MongoDB connection failures
- Document save failures
- Version creation failures (should rollback plan creation)

**Error Response Format:**
```json
{
  "error": "Error message",
  "details": "Detailed error description",
  "statusCode": 400
}
```

### TypeScript Types

**Shared Types (apps/api/src/types/training-plan.types.ts):**
```typescript
interface TrainingPlanMetadata {
  name?: string;
  goal?: string;
  raceName?: string;
  raceDate?: Date;
  raceDistance?: string;
  targetTime?: string;
  source?: 'manual_upload' | 'coach_provided' | 'ai_generated' | 'other';
}

interface CreateTrainingPlanInput {
  userId: string;
  trainingPlanCsv: string;
  metadata?: TrainingPlanMetadata;
}
```

### Performance Considerations

- Index on `userId` field in TrainingPlan for fast user lookups
- Index on `trainingPlanId` field in TrainingPlanVersion for fast version queries
- Index on `isActive` field in TrainingPlan for active plan queries
- Consider CSV size limits (recommend 1MB max) to prevent large document storage

### Code Style Requirements

- Arrow functions exclusively (no function declarations)
- Named exports only (no default exports)
- TypeScript strict mode with explicit types
- No `any` types
- Minimum 3-character variable names (except: id, _)
- Follow import order: React → External → Type imports → Internal → Relative

## Approach

### Implementation Order

1. **Phase 1: Data Models**
   - Create TrainingPlan Mongoose schema
   - Create TrainingPlanVersion Mongoose schema
   - Add necessary indexes for performance

2. **Phase 2: Service Layer**
   - Implement training-plan.service.ts with CRUD operations
   - Implement version creation logic
   - Add CSV validation helper functions

3. **Phase 3: API Layer**
   - Create Zod validators for request validation
   - Implement controller methods
   - Set up Express routes

4. **Phase 4: Integration**
   - Update recommendation flow to fetch training plans from database
   - Test end-to-end flow with AI service

### Transaction Handling

For training plan creation with version history:
```typescript
// Use Mongoose session for atomic operations
const session = await mongoose.startSession();
session.startTransaction();

try {
  const trainingPlan = await TrainingPlan.create([data], { session });
  const version = await TrainingPlanVersion.create([versionData], { session });
  await session.commitTransaction();
  return trainingPlan;
} catch (error) {
  await session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

### CSV Validation Strategy

Start with minimal validation:
```typescript
const validateCsv = (csvString: string): boolean => {
  // Basic checks
  if (!csvString || csvString.trim().length < 10) return false;

  // Check for at least one line break (multi-line CSV)
  if (!csvString.includes('\n')) return false;

  // Future: Add csv-parse library for robust validation
  return true;
};
```

Can enhance later with `csv-parse` if needed:
```typescript
import { parse } from 'csv-parse/sync';

const validateCsv = (csvString: string): boolean => {
  try {
    const records = parse(csvString);
    return records.length > 0;
  } catch {
    return false;
  }
};
```

## External Dependencies

No new external dependencies required. Existing tech stack covers all needs:

- **Mongoose** - Already in use for MongoDB ODM
- **Zod** - Already in use for schema validation
- **Express** - Already in use for routing

Optional: Consider `csv-parse` or `papaparse` for CSV validation if more robust parsing needed, but can validate with basic string checks initially.
