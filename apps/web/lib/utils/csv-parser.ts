/**
 * Parsed CSV data structure
 */
export interface ParsedCsvData {
  headers: string[];
  rows: Record<string, string>[];
}

/**
 * Parse CSV content into structured data
 *
 * @param csvContent - Raw CSV string content
 * @returns Parsed data with headers and rows
 * @throws Error if CSV content is empty or malformed
 */
export const parseCsvContent = (csvContent: string): ParsedCsvData => {
  // Handle empty content
  if (!csvContent || csvContent.trim().length === 0) {
    throw new Error('CSV content is empty');
  }

  // Split into lines and filter out empty lines
  const lines = csvContent
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    throw new Error('CSV content contains no valid lines');
  }

  if (lines.length < 2) {
    throw new Error('CSV content must contain at least a header row and one data row');
  }

  // Parse headers from first line
  const headers = lines[0].split(',').map((header) => header.trim());

  if (headers.length === 0) {
    throw new Error('CSV content contains no headers');
  }

  // Parse data rows
  const rows: Record<string, string>[] = [];

  for (let lineIndex = 1; lineIndex < lines.length; lineIndex++) {
    const line = lines[lineIndex];
    const values = line.split(',').map((value) => value.trim());

    // Skip rows that don't have the same number of columns as headers
    if (values.length !== headers.length) {
      console.warn(
        `Skipping malformed row ${lineIndex}: expected ${headers.length} columns, got ${values.length}`
      );
      continue;
    }

    // Create row object mapping headers to values
    const row: Record<string, string> = {};
    for (let columnIndex = 0; columnIndex < headers.length; columnIndex++) {
      row[headers[columnIndex]] = values[columnIndex];
    }

    rows.push(row);
  }

  if (rows.length === 0) {
    throw new Error('CSV content contains no valid data rows');
  }

  return {
    headers,
    rows,
  };
};
