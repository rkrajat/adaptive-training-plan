import { PDFParse } from "pdf-parse";

import { AppError, BadRequestError, InternalServerError } from "../utils/error";
import { log } from "../utils/logger";

import { aiService } from "./ai.service";

/**
 * PDF Processing Error Types
 */
export interface PdfProcessingError {
  code: "PARSE_ERROR" | "VALIDATION_ERROR" | "CONVERSION_ERROR" | "EMPTY_CONTENT";
  message: string;
  originalError?: Error;
}

/**
 * PDF Conversion Result
 */
export interface PdfConversionResult {
  success: boolean;
  csvContent?: string;
  error?: PdfProcessingError;
}

/**
 * PDF to CSV Service
 * Handles conversion of PDF training plans to CSV format using AI
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
   * Convert extracted PDF text to CSV format using LLM
   * @param text - Extracted text from PDF
   * @param startDate - Training plan start date in YYYY-MM-DD format
   * @returns CSV formatted string
   */
  async convertTextToCsvWithLlm(text: string, startDate: string): Promise<string> {
    try {
      log.info("Converting PDF text to CSV using LLM", {
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
   * Main orchestration method to convert PDF to CSV
   * @param pdfBuffer - PDF file buffer
   * @param startDate - Training plan start date in YYYY-MM-DD format
   * @returns Conversion result with CSV content or error
   */
  async convertPdfToCsv(pdfBuffer: Buffer, startDate: string): Promise<PdfConversionResult> {
    try {
      log.info("Starting PDF to CSV conversion", { startDate });

      // Step 1: Extract text from PDF
      const extractedText = await this.extractTextFromPdf(pdfBuffer);

      // Step 2: Validate PDF content
      this.validatePdfContent(extractedText);

      // Step 3: Convert to CSV using LLM
      const csvContent = await this.convertTextToCsvWithLlm(extractedText, startDate);

      // Step 4: Final validation - ensure CSV has content
      if (!csvContent || csvContent.trim().length === 0) {
        throw new InternalServerError(
          "Conversion resulted in empty CSV content."
        );
      }

      log.info("PDF to CSV conversion completed successfully", {
        csvLength: csvContent.length,
      });

      return {
        success: true,
        csvContent,
      };
    } catch (error) {
      log.error("PDF to CSV conversion failed", error);

      if (error instanceof AppError) {
        // Determine error code based on status code
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
          error: {
            code: errorCode,
            message: error.message,
            originalError: error,
          },
        };
      }

      return {
        success: false,
        error: {
          code: "CONVERSION_ERROR",
          message: "An unexpected error occurred during PDF conversion.",
          originalError: error as Error,
        },
      };
    }
  }
}

// Export singleton instance
export const pdfToCsvService = new PdfToCsvService();
