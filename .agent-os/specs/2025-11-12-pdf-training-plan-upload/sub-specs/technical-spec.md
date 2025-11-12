# Technical Specification

This is the technical specification for the spec detailed in @.agent-os/specs/2025-11-12-pdf-training-plan-upload/spec.md

## Technical Requirements

### Frontend Changes

**File: `/apps/web/components/UploadTrainingPlanDialog.tsx`**

- Update file input `accept` attribute from `".csv"` to `".csv,.pdf"` (line 108)
- Add file type detection in form validation to display appropriate error messages
- Update loading state messages to show conversion progress for PDF uploads:
  - Initial: "Uploading training plan..."
  - For PDFs: Add "Converting PDF to training plan..." during backend processing
- No changes to form fields (name, goal, raceName, raceDate, raceDistance, targetTime remain the same)
- Maintain existing error handling patterns with TanStack Query mutation

### Backend Changes

**File: `/apps/api/src/routes/training-plans.ts`**

- Update multer file filter to accept both CSV and PDF MIME types:
  - CSV: `text/csv`, `application/csv`, `text/plain`
  - PDF: `application/pdf`
- Update file size limits:
  - CSV: 5MB (existing)
  - PDF: 10MB (new)
- Add file type detection logic before calling `trainingPlanService.createTrainingPlan()`
- Route PDF files through new PDF processing pipeline

**File: `/apps/api/src/services/training-plan.service.ts`**

- Modify `createTrainingPlan()` method to accept an optional `fileType` parameter
- Add conditional logic:
  ```typescript
  if (fileType === 'pdf') {
    csvContent = await pdfToCsvService.convertPdfToCsv(file.buffer);
  } else {
    csvContent = parseCsvBuffer(file.buffer);
  }
  ```
- Keep all MongoDB transaction logic and version creation unchanged
- Pass validated CSV content to existing database storage logic

**New File: `/apps/api/src/services/pdf-to-csv.service.ts`**

Create a new service with the following methods:

1. `extractTextFromPdf(buffer: Buffer): Promise<string>`
   - Use `pdf-parse` library to extract raw text from PDF
   - Return extracted text as string
   - Throw `AppError` with 400 status if PDF is invalid or unreadable

2. `validatePdfContent(text: string): void`
   - Check minimum text length (e.g., 100 characters)
   - Check for training plan keywords: "week", "day", "run", "distance", "pace" (case-insensitive)
   - Throw `AppError` with 400 status and message: "PDF does not appear to contain a valid training plan"

3. `convertTextToCsvWithLlm(text: string): Promise<string>`
   - Call AI service with PDF text and conversion prompt (PLACEHOLDER - user will add later)
   - Prompt should instruct LLM to output CSV format matching existing training plan schema
   - Parse LLM response to extract CSV content
   - Return CSV string

4. `convertPdfToCsv(buffer: Buffer): Promise<string>`
   - Main orchestration method
   - Step 1: Extract text using `extractTextFromPdf()`
   - Step 2: Validate content using `validatePdfContent()`
   - Step 3: Convert to CSV using `convertTextToCsvWithLlm()`
   - Step 4: Validate CSV structure using existing `validateCsvStructure()`
   - Step 5: If validation fails, retry once with enhanced prompt
   - Step 6: If second attempt fails, throw `AppError` with 400 status
   - Return validated CSV string

**File: `/apps/api/src/utils/csv-validator.ts`**

- Update `validateCsvFile()` to accept PDF MIME types: `application/pdf`
- Add new file size validation for PDFs (10MB max)
- Keep existing CSV validation logic (5MB max)

**File: `/apps/api/src/services/ai.service.ts`**

- Add new method: `convertPdfTextToCsv(text: string): Promise<string>`
- This method will contain the PLACEHOLDER prompt for PDF-to-CSV conversion
- Use existing AI SDK for talkign with LLM
- Error handling: Log full error details, throw simplified error for user

### Error Handling

Implement specific error messages for each failure scenario:

1. **Invalid PDF Format**: "Unable to read PDF file. Please ensure it's a valid PDF document."
2. **PDF Parsing Failure**: "Could not extract text from PDF. The file may be password-protected or corrupted."
3. **Content Validation Failure**: "PDF does not appear to contain a valid training plan. Please ensure your file includes weeks, days, and workout details."
4. **LLM Conversion Failure**: "Failed to convert training plan. Please ensure your PDF contains a structured training plan with weeks and workouts."
5. **CSV Validation Failure**: "The converted training plan is missing required information (expected 1-52 weeks). Please check your PDF format and try again."

### Logging & Debugging

Add logging in `pdf-to-csv.service.ts`:
- Log PDF metadata: filename, size, page count
- Log extracted text length and first 200 characters
- Log LLM prompt and response (truncated to 500 chars)
- Log validation success/failure
- Use existing logging patterns from the codebase

## External Dependencies

### New Dependencies

- **pdf-parse** (version: `^1.1.1`)
  - **Purpose**: Extract raw text content from PDF files
  - **Justification**: Popular library (1M+ weekly downloads), simple API, no external dependencies, MIT licensed. Sufficient for text-based training plan PDFs without requiring the heavier pdf.js library.
  - **Installation**: `pnpm add pdf-parse` in `/apps/api`

### Existing Dependencies (No Changes)

- AI SDK (already installed for AI service)
- Multer (already configured for file uploads)
- Zod (already used for validation)
- MongoDB/Mongoose (already used for storage)
