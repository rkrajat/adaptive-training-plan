# Spec Tasks

These are the tasks to be completed for the spec detailed in @.agent-os/specs/2025-11-12-pdf-training-plan-upload/spec.md

> Created: 2025-11-12
> Status: Ready for Implementation

## Tasks

- [x] 1. Install PDF parsing dependency and set up service infrastructure

  - [x] 1.1 Install `pdf-parse` library in `/apps/api` using pnpm
  - [x] 1.2 Create new service file: `/apps/api/src/services/pdf-to-csv.service.ts` with method stubs
  - [x] 1.3 Add TypeScript types for PDF processing (PdfProcessingError, PdfConversionResult)
  - [x] 1.4 Verify service can be imported and no TypeScript compilation errors

- [x] 2. Implement PDF text extraction and validation

  - [x] 2.1 Implement `extractTextFromPdf()` using pdf-parse library with error handling
  - [x] 2.2 Implement `validatePdfContent()` with keyword checking and minimum length validation

- [x] 3. Implement LLM-based PDF to CSV conversion

  - [x] 3.1 Add new method `convertPdfTextToCsv()` in `/apps/api/src/services/ai.service.ts`
  - [x] 3.2 Add PLACEHOLDER prompt in `convertPdfTextToCsv()` with clear comments for user customization
  - [x] 3.3 Implement `convertTextToCsvWithLlm()` calling the AI service method
  - [x] 3.4 Add CSV extraction logic from LLM response (handle markdown code blocks)

- [x] 4. Implement main PDF conversion orchestration with retry logic

  - [x] 4.1 Implement `convertPdfToCsv()` orchestrating all steps (extract → validate → convert → validate CSV)
  - [x] 4.2 Implement comprehensive error handling for each step with specific AppError messages
  - [x] 4.3 Add detailed logging at each orchestration step

- [x] 5. Update backend file validation and routing

  - [x] 5.1 Update `/apps/api/src/utils/csv-validator.ts` to validate PDF files (MIME type, size limit)
  - [x] 5.2 Update multer configuration in `/apps/api/src/routes/training-plans.ts` to accept PDF files
  - [x] 5.3 Add file type detection logic (CSV vs PDF) based on MIME type

- [x] 6. Integrate PDF conversion into training plan service

  - [x] 6.1 Update `createTrainingPlan()` in `/apps/api/src/services/training-plan.service.ts` to accept fileType parameter
  - [x] 6.2 Add conditional logic: route PDF files through `pdfToCsvService.convertPdfToCsv()`
  - [x] 6.3 Ensure CSV files continue using existing `parseCsvBuffer()` path
  - [x] 6.4 Add error handling for PDF conversion failures with user-friendly messages

- [x] 7. Update frontend upload dialog to support PDF files
  - [x] 7.1 Update file input `accept` attribute in `/apps/web/components/UploadTrainingPlanDialog.tsx` to ".csv,.pdf"
  - [x] 7.2 Add file type detection in form validation (check file extension client-side)
  - [x] 7.3 Update loading state messages to show "Converting PDF..." for PDF uploads
  - [x] 7.4 Add conditional file size validation messaging (5MB for CSV, 10MB for PDF)
  - [x] 7.5 Test error message display for all PDF-specific errors (parsing, conversion, validation)
