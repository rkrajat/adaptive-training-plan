# Robust PDF-to-CSV Conversion System

## Overview

This document describes the complete PDF training plan extraction system, which handles both text-based and image-based PDFs using a hybrid approach with multiple reliability layers.

---

## Problem Statement

Training plans come in many PDF formats:
1. **Text-based PDFs** - Tables and text that can be extracted directly
2. **Image-based PDFs** - Training schedules embedded as images/screenshots (common with scanned documents or exported graphics)

The original system had two issues:
- Used `generateText()` which produced malformed CSV output
- Could not handle image-based PDFs at all (returned empty content)

---

## Solution Architecture

The system uses a **4-layer reliability architecture**:

```
┌─────────────────────────────────────────────────────────────────┐
│                    PDF EXTRACTION SYSTEM                        │
├─────────────────────────────────────────────────────────────────┤
│  Layer 1: Hybrid Extraction (Text + Vision)                     │
│  ├── Detects image-only pages automatically                     │
│  └── Uses GPT-4o vision for images, text for text-based PDFs    │
├─────────────────────────────────────────────────────────────────┤
│  Layer 2: Structured Output (Zod Schema)                        │
│  └── generateObject() guarantees valid JSON format              │
├─────────────────────────────────────────────────────────────────┤
│  Layer 3: Validation + Retry                                    │
│  ├── Row-level validation with business rules                   │
│  └── Up to 3 attempts with error feedback                       │
├─────────────────────────────────────────────────────────────────┤
│  Layer 4: Manual Fallback UI                                    │
│  └── User can fix extraction errors when auto-fix fails         │
└─────────────────────────────────────────────────────────────────┘
```

---

## System Flow Diagram

```
                              PDF Upload
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │  1. Analyze PDF Pages   │
                    │  (detect text vs image) │
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
              ▼                                   ▼
    ┌─────────────────┐                 ┌─────────────────┐
    │  Text-Only PDF  │                 │ Image-Heavy PDF │
    │                 │                 │                 │
    │  • Extract text │                 │ • Extract text  │
    │  • Validate     │                 │ • Render pages  │
    │    keywords     │                 │   as PNG images │
    └────────┬────────┘                 └────────┬────────┘
             │                                   │
             ▼                                   ▼
    ┌─────────────────┐                 ┌─────────────────┐
    │  2. LLM (Text)  │                 │ 2. LLM (Vision) │
    │                 │                 │                 │
    │  generateObject │                 │  generateObject │
    │  with text only │                 │  with images +  │
    │                 │                 │  text context   │
    └────────┬────────┘                 └────────┬────────┘
             │                                   │
             └─────────────────┬─────────────────┘
                               │
                               ▼
                    ┌─────────────────────────┐
                    │   3. Validate Output    │
                    │                         │
                    │  • Date/day matching    │
                    │  • Valid workout types  │
                    │  • Distance ranges      │
                    │  • Pace format          │
                    └───────────┬─────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
              ▼                                   ▼
         [VALID]                            [INVALID]
              │                                   │
              ▼                                   ▼
    ┌─────────────────┐                 ┌─────────────────┐
    │    SUCCESS!     │                 │  Retry (max 2x) │
    │                 │                 │  with error     │
    │  Save training  │                 │  feedback       │
    │  plan to DB     │                 └────────┬────────┘
    └─────────────────┘                          │
                                   ┌─────────────┴─────────────┐
                                   │                           │
                                   ▼                           ▼
                              [VALID]                   [STILL INVALID]
                                   │                           │
                                   ▼                           ▼
                         ┌─────────────────┐       ┌─────────────────┐
                         │    SUCCESS!     │       │ Manual Correction│
                         └─────────────────┘       │       UI         │
                                                   │                  │
                                                   │ User fixes rows  │
                                                   │ → Save corrected │
                                                   └─────────────────┘
```

---

## Implementation Details

### Layer 1: Hybrid Text + Vision Extraction

#### PDF Analysis Service
**File:** `apps/api/src/services/pdf-analysis.service.ts`

Analyzes each PDF page to determine if it contains extractable text or images.

```
┌──────────────────────────────────────────────────────────┐
│                  PDF Analysis Service                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  analyzePdf(buffer)                                      │
│  ├── Parse PDF with pdf-parse                            │
│  ├── Split text by page (form feed character)            │
│  ├── For each page:                                      │
│  │   └── hasSignificantText = textLength >= 100 chars    │
│  └── Return: imageOnlyPageNumbers[]                      │
│                                                          │
│  renderPagesAsImages(buffer, pageNumbers)                │
│  ├── Use pdf-to-img library                              │
│  ├── Render at 2x scale for quality                      │
│  └── Return: PNG Buffer[]                                │
│                                                          │
│  analyzeAndRenderImagePages(buffer)                      │
│  └── Convenience: analyze + render in one call           │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Key Decision:** Pages with < 100 characters are considered "image-only"

#### Vision Extraction Method
**File:** `apps/api/src/services/ai.service.ts`

```typescript
// For image-heavy PDFs
convertPdfImagesToStructuredPlan(images: Buffer[], textContent: string, startDate: string)

// For text-only PDFs (cheaper)
convertPdfTextToStructuredPlan(pdfText: string, startDate: string)
```

**Message structure for vision:**
```
┌─────────────────────────────────────────────────────────┐
│  System Prompt: Training plan extraction instructions   │
├─────────────────────────────────────────────────────────┤
│  User Message:                                          │
│  ├── [TEXT] "Extract training plan. Start: 2025-01-01" │
│  ├── [TEXT] "Additional extracted text: ..."           │
│  ├── [IMAGE] Page 3 as PNG                             │
│  ├── [IMAGE] Page 4 as PNG                             │
│  └── [IMAGE] Page 5 as PNG                             │
└─────────────────────────────────────────────────────────┘
```

---

### Layer 2: Structured Output with Zod Schema

**File:** `apps/api/src/schemas/training-plan-row.schema.ts`

Instead of asking the LLM to output raw CSV text, we use `generateObject()` with a Zod schema to guarantee valid JSON structure.

```
┌─────────────────────────────────────────────────────────┐
│                 TrainingPlanSchema                       │
├─────────────────────────────────────────────────────────┤
│  {                                                       │
│    rows: [                                               │
│      {                                                   │
│        date: "2025-01-06"       // YYYY-MM-DD regex     │
│        day: "Mon"               // enum validation       │
│        type: "Easy"             // enum validation       │
│        planned_distance_km: 8   // 0-100 range          │
│        target_pace_min_per_km: "5:30-5:45"  // regex    │
│        target_HR_zone: "Z2"     // enum or empty        │
│        notes: "Easy recovery"   // max 500 chars        │
│      },                                                  │
│      ...                                                 │
│    ]                                                     │
│  }                                                       │
└─────────────────────────────────────────────────────────┘
```

**Valid Values:**
| Field | Valid Values |
|-------|--------------|
| `type` | Easy, Long, Tempo, Interval, Recovery, Rest, Race, Cross-Training, Progression |
| `day` | Mon, Tue, Wed, Thu, Fri, Sat, Sun |
| `target_HR_zone` | Z1, Z2, Z3, Z4, Z5, "" |

---

### Layer 3: Validation + Retry Logic

**File:** `apps/api/src/services/pdf-validation.service.ts`

Validates each row against business rules beyond what Zod catches.

```
┌─────────────────────────────────────────────────────────┐
│              Validation Rules                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  1. Date/Day Matching                                    │
│     • If date is "2025-01-06" (Monday)                  │
│     • Then day MUST be "Mon"                            │
│     • Prevents: date="2025-01-06", day="Tue" (wrong!)   │
│                                                          │
│  2. Rest Day Distance                                    │
│     • If type is "Rest"                                 │
│     • Then planned_distance_km MUST be 0                │
│                                                          │
│  3. All Zod schema validations                          │
│     • Date format, enums, ranges, etc.                  │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Retry Flow:**
```
Attempt 1 ──► Validate ──► Invalid ──► Format errors for LLM
                                              │
                                              ▼
Attempt 2 ──► Validate ──► Invalid ──► Format errors for LLM
    ▲                                         │
    │                                         ▼
    └─── Include error context ────── Attempt 3 ──► Validate
                                                        │
                                          ┌─────────────┴─────────────┐
                                          │                           │
                                       [VALID]               [STILL INVALID]
                                          │                           │
                                       SUCCESS              Manual Correction
```

**Error feedback format sent to LLM on retry:**
```
PREVIOUS ATTEMPT FAILED - Please fix these issues:

Row 3:
  - Field 'day': Expected "Mon" for date 2025-01-06, but got "Tue"

Row 7:
  - Field 'planned_distance_km': Rest days must have distance 0, got 5
```

---

### Layer 4: Manual Correction UI

When all retries fail, the system returns extracted data for manual correction.

**Response structure:**
```typescript
{
  status: "requires_manual_correction",
  extractedData: {
    validRows: TrainingPlanRow[],        // Rows that passed validation
    invalidRows: [{
      rowIndex: number,
      data: unknown,                      // Raw extracted data
      errors: [{ field: string, message: string }]
    }]
  },
  totalRows: number,
  validRowCount: number,
  invalidRowCount: number,
  attemptsMade: 3
}
```

**UI Components:**
- `TrainingPlanRowEditor.tsx` - Editable row with field validation
- `ManualPlanCorrectionDialog.tsx` - Shows valid/invalid rows, allows editing

---

## Files Summary

### Created Files

| File | Purpose |
|------|---------|
| `apps/api/src/schemas/training-plan-row.schema.ts` | Zod schema for training plan rows |
| `apps/api/src/services/pdf-validation.service.ts` | Row-level validation + error formatting |
| `apps/api/src/services/pdf-analysis.service.ts` | PDF page analysis + image rendering |
| `apps/web/components/TrainingPlanRowEditor.tsx` | Editable row component |
| `apps/web/components/ManualPlanCorrectionDialog.tsx` | Manual correction UI |

### Modified Files

| File | Changes |
|------|---------|
| `apps/api/src/services/ai.service.ts` | Added `convertPdfTextToStructuredPlan()`, `convertPdfImagesToStructuredPlan()`, `structuredPlanToCsv()` |
| `apps/api/src/services/pdf-to-csv.service.ts` | Added hybrid extraction flow, retry logic, `convertPdfToCsvWithRetry()` |
| `apps/api/src/routes/training-plans.ts` | Handle `requires_manual_correction` response |
| `apps/web/components/UploadTrainingPlanDialog.tsx` | Trigger manual correction dialog |
| `apps/api/src/index.ts` | Increased timeout to 10 minutes |
| `apps/web/lib/api.ts` | Increased timeout to 10 minutes |

---

## Cost Considerations

Vision API calls are more expensive than text-only calls.

| PDF Type | Extraction Method | Estimated Cost |
|----------|-------------------|----------------|
| Text-only (all pages have text) | Text extraction | ~$0.01-0.03 |
| Mixed (some image pages) | Vision + text | ~$0.05-0.10 |
| Image-heavy (5+ image pages) | Vision | ~$0.15-0.25 |

**Optimization:** Vision is only used when image-only pages are detected.

---

## Timeout Configuration

Vision-based extraction with multiple retries can take several minutes.

| Component | Setting | Value |
|-----------|---------|-------|
| Backend | `server.timeout` | 10 minutes (600,000ms) |
| Backend | `server.keepAliveTimeout` | 10 min 5 sec |
| Backend | `server.headersTimeout` | 10 min 10 sec |
| Frontend | `ky.timeout` | 10 minutes (600,000ms) |

---

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `ai` | ^5.0.82 | Vercel AI SDK - `generateObject()`, vision support |
| `@ai-sdk/openai` | ^2.0.58 | OpenAI provider for GPT-4o |
| `pdf-parse` | ^2.4.5 | Extract text from PDF |
| `pdf-to-img` | latest | Render PDF pages as PNG images |
| `zod` | ^4.1.12 | Schema validation |

---

## Testing Checklist

### Automated Tests
- [ ] Zod schema validation with valid/invalid data
- [ ] Validation service catches date/day mismatches
- [ ] Retry logic with mocked LLM responses
- [ ] Error formatting produces valid feedback

### Manual Tests
- [ ] Text-based PDF → text extraction used (check logs)
- [ ] Image-based PDF → vision extraction used (check logs)
- [ ] Mixed PDF → correct pages rendered
- [ ] Validation failure triggers retry
- [ ] 3 failed attempts → manual correction UI shown
- [ ] Manual corrections save successfully
- [ ] Long extraction doesn't timeout

### Test PDFs
1. Clean text-based training plan
2. Scanned/image-based training plan
3. Mixed: cover page (image) + text content
4. PDF with date/day mismatches (to test validation)
5. Non-training-plan PDF (should reject)

---

## Error Handling Summary

| Scenario | Behavior |
|----------|----------|
| PDF parse fails | Return "Invalid PDF" error |
| No training keywords found | Return "Not a training plan" error |
| PDF analysis fails | Fall back to text-only extraction |
| LLM returns invalid format | Zod catches → retry with feedback |
| Validation fails (business rules) | Retry with error feedback (max 2x) |
| All retries exhausted | Return data for manual correction |
| Vision API fails | Log error, propagate to user |

---

## Architecture Diagram (Complete)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js)                              │
│                                                                         │
│  ┌──────────────────────┐    ┌──────────────────────────────────────┐  │
│  │ UploadTrainingPlan   │───►│ ManualPlanCorrectionDialog           │  │
│  │ Dialog               │    │ (shown when requires_manual_correction)│ │
│  └──────────┬───────────┘    └──────────────────────────────────────┘  │
│             │                                                           │
│             │ POST /api/training-plans/upload                          │
│             │ (timeout: 10 minutes)                                    │
└─────────────┼───────────────────────────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         BACKEND (Express)                               │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    training-plans.ts (Route)                     │   │
│  └─────────────────────────────────┬───────────────────────────────┘   │
│                                    │                                    │
│                                    ▼                                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                 pdf-to-csv.service.ts                            │   │
│  │                                                                  │   │
│  │  convertPdfToCsvWithRetry()                                      │   │
│  │  ├── 1. Analyze PDF (pdf-analysis.service)                       │   │
│  │  ├── 2. Extract text (pdf-parse)                                 │   │
│  │  ├── 3. Choose extraction method:                                │   │
│  │  │   ├── Text-only → ai.service.convertPdfTextToStructuredPlan  │   │
│  │  │   └── Vision    → ai.service.convertPdfImagesToStructuredPlan│   │
│  │  ├── 4. Validate (pdf-validation.service)                        │   │
│  │  └── 5. Retry up to 2x if invalid                               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                    │                                    │
│           ┌────────────────────────┼────────────────────────┐          │
│           ▼                        ▼                        ▼          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    │
│  │ pdf-analysis    │    │ ai.service      │    │ pdf-validation  │    │
│  │ .service        │    │                 │    │ .service        │    │
│  │                 │    │ • System prompt │    │                 │    │
│  │ • analyzePdf    │    │ • generateObject│    │ • validatePlan  │    │
│  │ • renderPages   │    │ • Zod schema    │    │ • formatErrors  │    │
│  │                 │    │ • Vision/Text   │    │                 │    │
│  └─────────────────┘    └────────┬────────┘    └─────────────────┘    │
│                                  │                                      │
└──────────────────────────────────┼──────────────────────────────────────┘
                                   │
                                   ▼
                    ┌──────────────────────────┐
                    │      OpenAI GPT-4o       │
                    │                          │
                    │  • Text understanding    │
                    │  • Vision (image input)  │
                    │  • Structured output     │
                    └──────────────────────────┘
```
