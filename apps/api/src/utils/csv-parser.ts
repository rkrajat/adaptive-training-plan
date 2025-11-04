import { AppError } from './error';

/**
 * Parse CSV content from buffer to string
 * According to spec: CSV content is stored as raw string for LLM-friendly format
 * This function validates that the content is parseable without performing deep validation
 */
export const parseCsvBuffer = (buffer: Buffer): string => {
  try {
    const csvContent = buffer.toString('utf-8').trim();

    if (!csvContent) {
      throw new AppError('CSV file is empty', 400);
    }

    // Basic validation: ensure it has at least some CSV-like structure
    const lines = csvContent.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      throw new AppError(
        'CSV file must contain at least a header row and one data row',
        400
      );
    }

    // Check if first line looks like a header (contains commas)
    const headerLine = lines[0];
    if (!headerLine.includes(',')) {
      throw new AppError(
        'CSV file must be comma-separated with a header row',
        400
      );
    }

    return csvContent;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Failed to parse CSV file: ${String(error)}`, 400);
  }
};

/**
 * Parse CSV string into structured weeks data for internal processing
 * Returns array of objects representing each week's training data
 */
export interface WeekData {
  week: number;
  [key: string]: string | number;
}

export const parseCsvToWeeksData = (csvContent: string): WeekData[] => {
  try {
    const lines = csvContent.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      throw new AppError('CSV must have header and data rows', 400);
    }

    // Parse header
    const headers = lines[0].split(',').map((header) => header.trim());

    // Parse data rows
    const weeksData: WeekData[] = [];

    for (let index = 1; index < lines.length; index++) {
      const line = lines[index].trim();
      if (!line) continue;

      const values = line.split(',').map((value) => value.trim());

      if (values.length !== headers.length) {
        throw new AppError(
          `Row ${index + 1} has ${values.length} columns but header has ${headers.length}`,
          400
        );
      }

      const rowData: WeekData = { week: index };
      headers.forEach((header, headerIndex) => {
        rowData[header.toLowerCase()] = values[headerIndex];
      });

      weeksData.push(rowData);
    }

    return weeksData;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(
      `Failed to parse CSV to weeks data: ${String(error)}`,
      400
    );
  }
};
