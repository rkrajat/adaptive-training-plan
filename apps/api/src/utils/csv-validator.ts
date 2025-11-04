import { AppError } from './error';
import { parseCsvToWeeksData } from './csv-parser';

/**
 * Validate CSV structure and content according to business rules
 * According to spec: CSV parseability check without deep content validation
 */
export const validateCsvStructure = (csvContent: string): void => {
  try {
    // Parse to verify structure
    const weeksData = parseCsvToWeeksData(csvContent);

    if (weeksData.length === 0) {
      throw new AppError('CSV must contain at least one week of data', 400);
    }

    // Validate that we have reasonable training plan data (at least 1 week, max 52 weeks)
    if (weeksData.length > 52) {
      throw new AppError(
        'CSV cannot contain more than 52 weeks of training data',
        400
      );
    }

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
 */
export const validateCsvFile = (
  file: Express.Multer.File | undefined
): void => {
  if (!file) {
    throw new AppError('No file uploaded', 400);
  }

  // Check MIME type
  const allowedMimeTypes = ['text/csv', 'application/csv', 'text/plain'];
  if (!allowedMimeTypes.includes(file.mimetype)) {
    throw new AppError(
      'Invalid file type. Only CSV files are allowed',
      400
    );
  }

  // Check file size (max 5MB)
  const maxSize = 5 * 1024 * 1024; // 5MB in bytes
  if (file.size > maxSize) {
    throw new AppError('File size exceeds 5MB limit', 400);
  }

  // Check file extension
  if (!file.originalname.toLowerCase().endsWith('.csv')) {
    throw new AppError(
      'Invalid file extension. File must have .csv extension',
      400
    );
  }
};
