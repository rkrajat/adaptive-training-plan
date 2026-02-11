import { PDFParse } from "pdf-parse";
import { pdf } from "pdf-to-img";

import { log } from "../utils/logger";

/**
 * Analysis result for a single PDF page
 */
export interface PageAnalysis {
  pageNumber: number;
  textLength: number;
  hasSignificantText: boolean;
}

/**
 * Complete PDF analysis result
 */
export interface PdfAnalysisResult {
  totalPages: number;
  pages: PageAnalysis[];
  hasImageOnlyPages: boolean;
  imageOnlyPageNumbers: number[];
}

/**
 * Minimum character count to consider a page as having significant text
 * Pages with less text than this threshold are considered "image-only"
 */
const SIGNIFICANT_TEXT_THRESHOLD = 100;

/**
 * PDF Analysis Service
 * Analyzes PDF pages to detect which have extractable text vs images
 */
export class PdfAnalysisService {
  /**
   * Analyze PDF to detect which pages have text vs images
   * @param pdfBuffer - PDF file buffer
   * @returns Analysis result with page-by-page breakdown
   */
  async analyzePdf(pdfBuffer: Buffer): Promise<PdfAnalysisResult> {
    try {
      log.info("Analyzing PDF for text/image content");

      const parser = new PDFParse({ data: pdfBuffer });
      const result = await parser.getText();

      const totalPages = result.total;
      const pages: PageAnalysis[] = [];

      // Get per-page text if available
      // pdf-parse getText() returns combined text, we need to parse individual pages
      // We'll use the page breaks to estimate per-page content
      const pageTexts = result.text.split(/\f/); // Form feed character often separates pages

      for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
        const pageText = pageTexts[pageIdx] || "";
        const trimmedText = pageText.trim();
        const textLength = trimmedText.length;
        const hasSignificantText = textLength >= SIGNIFICANT_TEXT_THRESHOLD;

        pages.push({
          pageNumber: pageIdx + 1,
          textLength,
          hasSignificantText,
        });
      }

      // Clean up parser
      await parser.destroy();

      const imageOnlyPageNumbers = pages
        .filter((page) => !page.hasSignificantText)
        .map((page) => page.pageNumber);

      const hasImageOnlyPages = imageOnlyPageNumbers.length > 0;

      log.info("PDF analysis complete", {
        totalPages,
        imageOnlyPageCount: imageOnlyPageNumbers.length,
        hasImageOnlyPages,
        imageOnlyPageNumbers:
          imageOnlyPageNumbers.length <= 10
            ? imageOnlyPageNumbers
            : `${imageOnlyPageNumbers.slice(0, 10).join(", ")}... (${imageOnlyPageNumbers.length} total)`,
      });

      return {
        totalPages,
        pages,
        hasImageOnlyPages,
        imageOnlyPageNumbers,
      };
    } catch (error) {
      log.error("Failed to analyze PDF", error);
      throw error;
    }
  }

  /**
   * Render specific PDF pages as PNG images
   * @param pdfBuffer - PDF file buffer
   * @param pageNumbers - Array of 1-indexed page numbers to render
   * @returns Array of PNG image buffers
   */
  async renderPagesAsImages(
    pdfBuffer: Buffer,
    pageNumbers: number[]
  ): Promise<Buffer[]> {
    try {
      log.info("Rendering PDF pages as images", {
        pageCount: pageNumbers.length,
        pages: pageNumbers.length <= 10 ? pageNumbers : `${pageNumbers.length} pages`,
      });

      const images: Buffer[] = [];

      // Convert PDF to images using pdf-to-img
      // The library yields images one at a time
      const pdfDocument = await pdf(pdfBuffer, {
        scale: 2.0, // 2x scale for better quality
      });

      let currentPage = 0;
      for await (const image of pdfDocument) {
        currentPage++;

        // Only keep images for requested pages (1-indexed)
        if (pageNumbers.includes(currentPage)) {
          images.push(Buffer.from(image));
        }

        // Early exit if we've collected all needed pages
        if (images.length === pageNumbers.length) {
          break;
        }
      }

      log.info("PDF pages rendered successfully", {
        renderedCount: images.length,
        totalSizeBytes: images.reduce((sum, img) => sum + img.length, 0),
      });

      return images;
    } catch (error) {
      log.error("Failed to render PDF pages as images", error);
      throw error;
    }
  }

  /**
   * Convenience method: Analyze PDF and render image-only pages if detected
   * @param pdfBuffer - PDF file buffer
   * @returns Analysis result plus rendered images for image-only pages
   */
  async analyzeAndRenderImagePages(
    pdfBuffer: Buffer
  ): Promise<{ analysis: PdfAnalysisResult; images: Buffer[] }> {
    const analysis = await this.analyzePdf(pdfBuffer);

    let images: Buffer[] = [];
    if (analysis.hasImageOnlyPages) {
      images = await this.renderPagesAsImages(pdfBuffer, analysis.imageOnlyPageNumbers);
    }

    return { analysis, images };
  }
}

// Export singleton instance
export const pdfAnalysisService = new PdfAnalysisService();
