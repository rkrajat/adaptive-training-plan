# Spec Requirements Document

> Spec: PDF Training Plan Upload
> Created: 2025-11-12

## Overview

Extend the existing training plan upload functionality to support PDF file uploads in addition to CSV files, using Node.js PDF parsing and LLM-based conversion to extract training plan data and store it in the standard CSV format. This feature enables users to upload training plans in their original PDF format without manual CSV conversion, improving user experience and reducing friction in the onboarding process.

## User Stories

### Upload Training Plan from PDF

As a runner, I want to upload my training plan PDF file directly to the platform, so that I don't have to manually convert it to CSV format before uploading.

**Workflow:**
1. User opens the Upload Training Plan dialog
2. User selects a PDF file containing their training plan (up to 10MB)
3. System displays progress: "Uploading → Extracting text → Converting to training plan → Validating → Saving"
4. System extracts text from the PDF, sends it to an LLM with a conversion prompt, validates the generated CSV, and stores it in the database
5. User sees their uploaded training plan in the plans list with all metadata (name, goal, race details)
6. If conversion fails, user sees a clear error message explaining the issue

### Maintain Existing CSV Upload Support

As a user with a CSV training plan, I want to continue uploading CSV files directly, so that I can use whichever format is most convenient for me.

**Workflow:**
1. User opens the Upload Training Plan dialog
2. User can choose between uploading a CSV file or a PDF file
3. CSV uploads continue to work exactly as before with no changes to the user experience
4. Backend automatically detects file type and routes to the appropriate parser

## Spec Scope

1. **PDF File Upload Support** - Extend UploadTrainingPlanDialog to accept both `.csv` and `.pdf` file types with appropriate file size limits (5MB for CSV, 10MB for PDF).

2. **PDF Text Extraction** - Implement PDF parsing in Node.js using the `pdf-parse` library to extract raw text content from uploaded PDF files.

3. **LLM-Based CSV Conversion** - Create a new service that sends extracted PDF text to an LLM (Claude) with a sophisticated prompt (placeholder) to convert unstructured training plan data into standardized CSV format.

4. **CSV Validation** - Validate LLM-generated CSV output using existing validation functions (`validateCsvStructure()`, `validateCsvFile()`) with a single retry mechanism if validation fails.

5. **Error Handling & User Feedback** - Implement comprehensive error handling for PDF parsing failures, LLM conversion failures, and validation errors with clear, actionable error messages displayed to users.

## Out of Scope

- Multi-page PDF handling with images or complex layouts (focus on text-based table extraction)
- OCR support for scanned/image-based PDFs
- PDF preview before upload
- Batch PDF upload (multiple files at once)
- Editing or modifying the LLM prompt through the UI (prompt is hardcoded in backend service)
- Support for password-protected PDFs
- PDF validation for specific training plan formats or templates

## Expected Deliverable

1. Users can successfully upload PDF training plans through the UploadTrainingPlanDialog, and the system converts them to CSV format and stores them in the database with the same data structure as CSV uploads.

2. The existing CSV upload functionality continues to work without any regressions, and users can upload either CSV or PDF files interchangeably.

3. Clear error messages are displayed when PDF parsing or conversion fails, including specific guidance on what went wrong (invalid PDF, unreadable content, conversion failure, validation error).
