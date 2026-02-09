import { PDFParse } from "pdf-parse";

import type { TrainingPlan } from "../schemas/training-plan-row.schema";
import { AppError, BadRequestError, InternalServerError } from "../utils/error";
import { log } from "../utils/logger";

import { aiService } from "./ai.service";
import {
  pdfAnalysisService,
  type PdfAnalysisResult,
} from "./pdf-analysis.service";
import {
  pdfValidationService,
  type ValidationResult,
  type ValidationError,
} from "./pdf-validation.service";

/**
 * Maximum number of retry attempts for LLM conversion
 */
const MAX_RETRIES = 2;

/**
 * Base delay in milliseconds for exponential backoff
 */
const RETRY_DELAY_MS = 1000;

/**
 * PDF Processing Error Types
 */
export interface PdfProcessingError {
  code: "PARSE_ERROR" | "VALIDATION_ERROR" | "CONVERSION_ERROR" | "EMPTY_CONTENT";
  message: string;
  originalError?: Error;
}

/**
 * PDF Conversion Result (legacy interface for backwards compatibility)
 */
export interface PdfConversionResult {
  success: boolean;
  csvContent?: string;
  error?: PdfProcessingError;
}

/**
 * Extended PDF Conversion Result with validation details
 */
export interface PdfConversionResultWithValidation {
  success: boolean;
  csvContent?: string;
  structuredPlan?: TrainingPlan;
  validationResult?: ValidationResult;
  requiresManualCorrection: boolean;
  error?: PdfProcessingError;
  attemptsMade: number;
}

/**
 * Extracted data for manual correction UI
 */
export interface ExtractedDataForCorrection {
  validRows: TrainingPlan["rows"];
  invalidRows: {
    rowIndex: number;
    data: unknown;
    errors: { field: string; message: string }[];
  }[];
  totalRows: number;
  validRowCount: number;
  invalidRowCount: number;
}

/**
 * PDF to CSV Service
 * Handles conversion of PDF training plans to CSV format using AI
 * with structured output, validation, and retry logic
 */
export class PdfToCsvService {
  /**
   * Extract text content from PDF buffer
   * @param pdfBuffer - PDF file buffer
   * @returns Extracted text content
   */
  async extractTextFromPdf(pdfBuffer: Buffer): Promise<string> {
    try {
      log.info("Extracting text from PDF");

      const parser = new PDFParse({ data: pdfBuffer });
      const result = await parser.getText();
      const text = result.text;

      log.info("PDF text extraction successful", {
        textLength: text.length,
        pages: result.total,
      });

      // Clean up the parser instance
      await parser.destroy();

      return text;
    } catch (error) {
      log.error("Failed to extract text from PDF", error);
      throw new BadRequestError(
        "Failed to parse PDF file. The file may be corrupted or password-protected.",
        error
      );
    }
  }

  /**
   * Validate PDF content to ensure it contains training plan data
   * @param text - Extracted text from PDF
   */
  validatePdfContent(text: string): void {
    const trimmedText = text.trim();

    // Check minimum length
    if (trimmedText.length < 50) {
      throw new BadRequestError(
        "PDF appears to be empty or contains insufficient content. Please ensure the PDF contains a training plan."
      );
    }

    // Check for training plan keywords
    const keywords = [
      "week",
      "day",
      "run",
      "distance",
      "pace",
      "training",
      "km",
      "mile",
      "workout",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];

    const lowerText = trimmedText.toLowerCase();
    const foundKeywords = keywords.filter((keyword) =>
      lowerText.includes(keyword)
    );

    if (foundKeywords.length < 3) {
      throw new BadRequestError(
        "PDF does not appear to contain a training plan. Please upload a valid training plan document."
      );
    }

    log.info("PDF content validation successful", {
      textLength: trimmedText.length,
      foundKeywords: foundKeywords.length,
    });
  }

  /**
   * Convert PDF to CSV with structured output, validation, and retry logic
   * Uses hybrid text + vision extraction: detects image-only pages and uses
   * GPT-4o vision for those pages while using cheaper text extraction for text-based pages
   * @param pdfBuffer - PDF file buffer
   * @param startDate - Training plan start date in YYYY-MM-DD format
   * @param targetTimeSeconds - Optional target race time in seconds for pace group matching
   * @returns Conversion result with validation details
   */
  async convertPdfToCsvWithRetry(
    pdfBuffer: Buffer,
    startDate: string,
    targetTimeSeconds?: number,
    filename?: string
  ): Promise<PdfConversionResultWithValidation> {
    let attempts = 0;
    let lastValidationResult: ValidationResult | undefined;
    let lastErrorContext: string | undefined;

    try {
      // Step 1: Analyze PDF to detect image-only pages
      log.info("Analyzing PDF for text vs image content");
      let pdfAnalysis: PdfAnalysisResult;
      let renderedImages: Buffer[] = [];

      try {
        const analysisResult = await pdfAnalysisService.analyzeAndRenderImagePages(pdfBuffer);
        pdfAnalysis = analysisResult.analysis;
        renderedImages = analysisResult.images;
      } catch (analysisError) {
        log.warn("PDF analysis failed, falling back to text-only extraction", {
          error: analysisError instanceof Error ? analysisError.message : String(analysisError),
        });
        // If analysis fails, fall back to text-only approach
        pdfAnalysis = {
          totalPages: 0,
          pages: [],
          hasImageOnlyPages: false,
          imageOnlyPageNumbers: [],
        };
      }

      // Step 2: Extract text from PDF (always done, even for image-heavy PDFs)
      const extractedText = await this.extractTextFromPdf(pdfBuffer);

      // Step 3: Determine extraction method based on analysis
      const useVisionExtraction = pdfAnalysis.hasImageOnlyPages && renderedImages.length > 0;

      if (useVisionExtraction) {
        log.info("Using vision extraction for image-heavy PDF", {
          imageOnlyPages: pdfAnalysis.imageOnlyPageNumbers.length,
          totalPages: pdfAnalysis.totalPages,
          renderedImageCount: renderedImages.length,
        });
      } else {
        // For text-only PDFs, validate content as before
        this.validatePdfContent(extractedText);
      }

      // Step 4: Attempt conversion with retries
      while (attempts <= MAX_RETRIES) {
        attempts++;

        log.info(`PDF conversion attempt ${attempts}/${MAX_RETRIES + 1}`, {
          startDate,
          isRetry: attempts > 1,
          extractionMethod: useVisionExtraction ? "vision" : "text",
        });

        try {
          // Convert using appropriate method based on PDF content
          let structuredPlan: TrainingPlan;

          if (useVisionExtraction) {
            // Use vision extraction for image-heavy PDFs
            structuredPlan = await aiService.convertPdfImagesToStructuredPlan(
              renderedImages,
              extractedText,
              startDate,
              targetTimeSeconds,
              lastErrorContext,
              filename
            );
          } else {
            // Use text-only extraction (cheaper) for text-based PDFs
            structuredPlan = await aiService.convertPdfTextToStructuredPlan(
              extractedText,
              startDate,
              targetTimeSeconds,
              lastErrorContext,
              filename
            );
          }

          // Validate the result
          const validationResult = pdfValidationService.validateTrainingPlan(structuredPlan);
          lastValidationResult = validationResult;

          if (validationResult.isValid) {
            // Success - convert to CSV
            const csvContent = aiService.structuredPlanToCsv(structuredPlan);

            log.info("PDF conversion successful", {
              attempts,
              rowCount: structuredPlan.rows.length,
              extractionMethod: useVisionExtraction ? "vision" : "text",
            });

            return {
              success: true,
              csvContent,
              structuredPlan,
              validationResult,
              requiresManualCorrection: false,
              attemptsMade: attempts,
            };
          }

          // Validation failed - prepare error context for retry
          lastErrorContext = pdfValidationService.formatErrorsForRetry(validationResult.errors);

          log.warn(`PDF conversion validation failed, attempt ${attempts}`, {
            errorCount: validationResult.errors.length,
            willRetry: attempts <= MAX_RETRIES,
            extractionMethod: useVisionExtraction ? "vision" : "text",
            sampleErrors: validationResult.errors.slice(0, 3).map((e) => ({
              row: e.rowIndex,
              field: e.field,
              message: e.message,
            })),
          });

          // Wait before retrying (exponential backoff)
          if (attempts <= MAX_RETRIES) {
            await this.delay(RETRY_DELAY_MS * attempts);
          }
        } catch (conversionError) {
          log.error(`PDF conversion error on attempt ${attempts}`, conversionError);

          lastErrorContext =
            conversionError instanceof Error
              ? conversionError.message
              : String(conversionError);

          // Wait before retrying
          if (attempts <= MAX_RETRIES) {
            await this.delay(RETRY_DELAY_MS * attempts);
          }
        }
      }

      // All retries exhausted - return for manual correction
      log.warn("PDF conversion failed after all retries, requires manual correction", {
        attempts,
        errorCount: lastValidationResult?.errors.length,
        extractionMethod: useVisionExtraction ? "vision" : "text",
      });

      return {
        success: false,
        validationResult: lastValidationResult,
        requiresManualCorrection: true,
        attemptsMade: attempts,
        error: {
          code: "VALIDATION_ERROR",
          message:
            "We extracted your training plan but found some issues that need manual correction.",
        },
      };
    } catch (error) {
      log.error("PDF conversion failed with unrecoverable error", error);

      if (error instanceof AppError) {
        let errorCode: PdfProcessingError["code"] = "CONVERSION_ERROR";
        if (error.statusCode === 400) {
          if (error.message.includes("parse")) {
            errorCode = "PARSE_ERROR";
          } else if (error.message.includes("empty")) {
            errorCode = "EMPTY_CONTENT";
          } else {
            errorCode = "VALIDATION_ERROR";
          }
        }

        return {
          success: false,
          requiresManualCorrection: false,
          attemptsMade: attempts,
          error: {
            code: errorCode,
            message: error.message,
            originalError: error,
          },
        };
      }

      return {
        success: false,
        requiresManualCorrection: false,
        attemptsMade: attempts,
        error: {
          code: "CONVERSION_ERROR",
          message: "An unexpected error occurred during PDF conversion.",
          originalError: error as Error,
        },
      };
    }
  }

  /**
   * Build extracted data for manual correction UI
   * @param validationResult - The validation result with valid/invalid rows
   * @returns Data structure for the correction UI
   */
  buildExtractedDataForCorrection(
    validationResult: ValidationResult
  ): ExtractedDataForCorrection {
    return {
      validRows: validationResult.validRows,
      invalidRows: validationResult.invalidRows.map((invalid) => ({
        rowIndex: invalid.rowIndex,
        data: invalid.row,
        errors: invalid.errors.map((e: ValidationError) => ({
          field: e.field,
          message: e.message,
        })),
      })),
      totalRows: validationResult.validRows.length + validationResult.invalidRows.length,
      validRowCount: validationResult.validRows.length,
      invalidRowCount: validationResult.invalidRows.length,
    };
  }

  /**
   * Helper method to delay execution
   * @param ms - Milliseconds to delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * @deprecated Use convertPdfToCsvWithRetry instead
   * Convert extracted PDF text to CSV format using LLM (legacy method)
   * @param text - Extracted text from PDF
   * @param startDate - Training plan start date in YYYY-MM-DD format
   * @returns CSV formatted string
   */
  async convertTextToCsvWithLlm(text: string, startDate: string): Promise<string> {
    try {
      log.info("Converting PDF text to CSV using LLM (legacy method)", {
        textLength: text.length,
        startDate,
      });

      const csvResult = await aiService.convertPdfTextToCsv(text, startDate);

      // Extract CSV content from LLM response
      // Handle potential markdown code blocks
      let csvContent = csvResult.trim();

      // Remove markdown code block syntax if present
      if (csvContent.startsWith("```")) {
        const lines = csvContent.split("\n");
        // Remove first line (```csv or ```)
        lines.shift();
        // Remove last line (```)
        if (lines[lines.length - 1]?.trim() === "```") {
          lines.pop();
        }
        csvContent = lines.join("\n").trim();
      }

      if (!csvContent) {
        throw new InternalServerError(
          "Failed to convert PDF to CSV format. The LLM returned empty content."
        );
      }

      log.info("PDF to CSV conversion successful", {
        csvLength: csvContent.length,
        lineCount: csvContent.split("\n").length,
      });

      return csvContent;
    } catch (error) {
      log.error("Failed to convert PDF text to CSV", error);

      if (error instanceof AppError) {
        throw error;
      }

      throw new InternalServerError(
        "Failed to convert PDF to training plan format. Please ensure the PDF contains a structured training plan.",
        error
      );
    }
  }

  /**
   * @deprecated Use convertPdfToCsvWithRetry instead
   * Main orchestration method to convert PDF to CSV (legacy interface)
   * @param pdfBuffer - PDF file buffer
   * @param startDate - Training plan start date in YYYY-MM-DD format
   * @returns Conversion result with CSV content or error
   */
  async convertPdfToCsv(pdfBuffer: Buffer, startDate: string): Promise<PdfConversionResult> {
    // Use new method and convert to legacy format
    const result = await this.convertPdfToCsvWithRetry(pdfBuffer, startDate);

    if (result.success && result.csvContent) {
      return {
        success: true,
        csvContent: result.csvContent,
      };
    }

    return {
      success: false,
      error: result.error,
    };
  }
}

// Export singleton instance
export const pdfToCsvService = new PdfToCsvService();
