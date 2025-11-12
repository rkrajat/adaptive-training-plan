# API Specification

This is the API specification for the spec detailed in @.agent-os/specs/2025-11-12-pdf-training-plan-upload/spec.md

## Endpoints

### POST `/api/training-plans`

**Purpose:** Upload a training plan file (CSV or PDF) with metadata and store it in the database after validation and optional conversion.

**Changes from Existing Implementation:**
- Accept PDF files in addition to CSV files
- Add file type detection logic
- Route PDFs through PDF-to-CSV conversion service

**Authentication:** Required (JWT)

**Request Format:** `multipart/form-data`

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| file | File | Yes | Training plan file (.csv or .pdf, max 5MB for CSV, 10MB for PDF) |
| name | String | Yes | Name of the training plan |
| goal | String | Yes | Training goal (e.g., "Marathon PR", "Base Building") |
| raceName | String | No | Name of target race |
| raceDate | Date | No | Date of target race (ISO 8601 format) |
| raceDistance | Number | No | Race distance in kilometers |
| targetTime | String | No | Target finish time (HH:MM:SS format) |

**File Validation:**

CSV Files:
- MIME types: `text/csv`, `application/csv`, `text/plain`
- File extension: `.csv`
- Max size: 5MB

PDF Files:
- MIME type: `application/pdf`
- File extension: `.pdf`
- Max size: 10MB

**Response Format (Success - 201 Created):**

```json
{
  "id": "507f1f77bcf86cd799439011",
  "name": "Marathon Training Plan",
  "goal": "Marathon PR",
  "raceName": "Boston Marathon",
  "raceDate": "2025-04-21T00:00:00.000Z",
  "raceDistance": 42.2,
  "targetTime": "03:30:00",
  "source": "user_upload",
  "isActive": true,
  "currentWeek": 1,
  "startDate": "2025-11-12T00:00:00.000Z",
  "createdAt": "2025-11-12T10:30:00.000Z",
  "updatedAt": "2025-11-12T10:30:00.000Z",
  "csvContent": "Week,Day,Run Type,Distance (km),...",
  "versionHistory": [
    {
      "versionNumber": 1,
      "csvContent": "Week,Day,Run Type,Distance (km),...",
      "changeType": "created",
      "createdAt": "2025-11-12T10:30:00.000Z"
    }
  ]
}
```

**Error Responses:**

**400 Bad Request - File Validation Errors:**
```json
{
  "error": "File validation failed",
  "message": "File must be a CSV or PDF"
}
```

```json
{
  "error": "File validation failed",
  "message": "PDF file size must not exceed 10MB"
}
```

**400 Bad Request - PDF Processing Errors:**
```json
{
  "error": "PDF processing failed",
  "message": "Unable to read PDF file. Please ensure it's a valid PDF document."
}
```

```json
{
  "error": "PDF processing failed",
  "message": "Could not extract text from PDF. The file may be password-protected or corrupted."
}
```

```json
{
  "error": "PDF processing failed",
  "message": "PDF does not appear to contain a valid training plan. Please ensure your file includes weeks, days, and workout details."
}
```

**400 Bad Request - Conversion/Validation Errors:**
```json
{
  "error": "Conversion failed",
  "message": "Failed to convert training plan. Please ensure your PDF contains a structured training plan with weeks and workouts."
}
```

```json
{
  "error": "CSV validation failed",
  "message": "The converted training plan is missing required information (expected 1-52 weeks). Please check your PDF format and try again."
}
```

**401 Unauthorized:**
```json
{
  "error": "Authentication required",
  "message": "No token provided"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Server error",
  "message": "An unexpected error occurred while processing your request"
}
```

## Controllers

### Training Plans Controller (`/apps/api/src/routes/training-plans.ts`)

**Modified Endpoint Handler: POST `/`**

**Business Logic Changes:**

1. **File Type Detection** (NEW)
   - Detect uploaded file type based on MIME type and extension
   - Set `fileType` variable to `'csv'` or `'pdf'`

2. **File Validation** (MODIFIED)
   - Validate CSV files using existing `validateCsvFile()`
   - Validate PDF files using updated `validateCsvFile()` with PDF support
   - Check file size limits (5MB for CSV, 10MB for PDF)

3. **Metadata Validation** (UNCHANGED)
   - Validate required fields: name, goal
   - Validate optional fields: raceName, raceDate, raceDistance, targetTime
   - Use existing Zod schema validation

4. **Training Plan Creation** (MODIFIED)
   - Pass `fileType` to `trainingPlanService.createTrainingPlan()`
   - Service handles CSV parsing or PDF conversion based on file type
   - Return training plan with version history

**Error Handling:**
- Wrap all operations in try-catch block
- Log errors with request context (user ID, file name, file type)
- Return appropriate HTTP status codes and error messages
- Use existing `AppError` class for consistent error responses

## Integration Points

### Existing Services Used

1. **`trainingPlanService.createTrainingPlan()`** (MODIFIED)
   - Add file type parameter
   - Add conditional logic for PDF vs CSV processing

2. **`ai.service.ts`** (EXTENDED)
   - Add new method: `convertPdfTextToCsv(text: string)`
   - Reuse existing AI SDK configuration and error handling

3. **`csv-parser.ts`** (UNCHANGED)
   - Continue to use `parseCsvBuffer()` for CSV files

4. **`csv-validator.ts`** (MODIFIED)
   - Update `validateCsvFile()` to accept PDF MIME types
   - Add PDF file size validation (10MB)
   - Keep CSV validation logic unchanged

### New Service Created

**`pdf-to-csv.service.ts`**
- Exports: `convertPdfToCsv(buffer: Buffer): Promise<string>`
- Used by: `training-plan.service.ts`
- Dependencies: `pdf-parse`, `ai.service.ts`, `csv-validator.ts`

