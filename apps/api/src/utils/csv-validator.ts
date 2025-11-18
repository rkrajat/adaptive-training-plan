import { parseCsvToWeeksData } from "./csv-parser";
import { AppError } from "./error";

/**
 * Validate CSV structure and content according to business rules
 * According to spec: CSV parseability check without deep content validation
 */
export const validateCsvStructure = (csvContent: string): void => {
  try {
    // Parse to verify structure
    const weeksData = parseCsvToWeeksData(csvContent);

    if (weeksData.length === 0) {
      throw new AppError("CSV must contain at least one week of data", 400);
    }

    // Validate that we have reasonable training plan data (at least 1 week, max 52 weeks)
    // if (weeksData.length > 52) {
    //   throw new AppError(
    //     "CSV cannot contain more than 52 weeks of training data",
    //     400
    //   );
    // }

    // Basic validation passed
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`CSV validation failed: ${String(error)}`, 400);
  }
};

/**
 * Validate file upload (MIME type and size)
 * Supports both CSV and PDF files
 */
export const validateCsvFile = (
  file: Express.Multer.File | undefined
): void => {
  if (!file) {
    throw new AppError("No file uploaded", 400);
  }

  // Check MIME type - allow both CSV and PDF
  const csvMimeTypes = ["text/csv", "application/csv", "text/plain"];
  const pdfMimeTypes = ["application/pdf"];
  const allowedMimeTypes = [...csvMimeTypes, ...pdfMimeTypes];

  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new AppError(
      "Invalid file type. Only CSV and PDF files are allowed",
      400
    );
  }

  // Determine file type
  const isPdf = pdfMimeTypes.includes(file.mimetype);
  const isCsv = csvMimeTypes.includes(file.mimetype);

  // Check file size - 5MB for CSV, 10MB for PDF
  const maxSize = isPdf ? 10 * 1024 * 1024 : 5 * 1024 * 1024;
  const maxSizeLabel = isPdf ? "10MB" : "5MB";

  if (file.size > maxSize) {
    throw new AppError(`File size exceeds ${maxSizeLabel} limit`, 400);
  }

  // Check file extension
  const filename = file.originalname.toLowerCase();
  const hasValidExtension =
    filename.endsWith(".csv") || filename.endsWith(".pdf");

  if (!hasValidExtension) {
    throw new AppError(
      "Invalid file extension. File must have .csv or .pdf extension",
      400
    );
  }

  // Validate extension matches MIME type
  if (isCsv && !filename.endsWith(".csv")) {
    throw new AppError(
      "File extension does not match content type. CSV files must have .csv extension",
      400
    );
  }

  if (isPdf && !filename.endsWith(".pdf")) {
    throw new AppError(
      "File extension does not match content type. PDF files must have .pdf extension",
      400
    );
  }
};
