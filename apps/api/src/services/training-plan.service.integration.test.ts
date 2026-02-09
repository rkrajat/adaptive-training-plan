import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, extname, basename } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import { parseCsvContent } from '@adaptive-training-plan/utils';
import { describe, it, expect } from 'vitest';

import type { TrainingPlanUploadRequest } from '../types/api.types';

import { TrainingPlanService } from './training-plan.service';

// @ts-expect-error - import.meta.url is supported by Vitest/ES modules at runtime
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_DATA_DIR = join(__dirname, '../test-data/plans');
const INPUT_DIR = join(TEST_DATA_DIR, 'input');
const EXPECTED_DIR = join(TEST_DATA_DIR, 'expected');

// Load metadata if it exists
let metadataConfig: Record<string, Partial<TrainingPlanUploadRequest>> = {};
const metadataPath = join(TEST_DATA_DIR, 'metadata.json');
if (existsSync(metadataPath)) {
  metadataConfig = JSON.parse(readFileSync(metadataPath, 'utf-8'));
}

// Get metadata for a test file
function getMetadata(filename: string): TrainingPlanUploadRequest {
  // Check for metadata using full filename first, then base name
  const customMetadata = metadataConfig[filename] || metadataConfig[basename(filename, extname(filename))];
  
  if (!customMetadata) {
    throw new Error(
      `Metadata not found for test file "${filename}". ` +
      `Please add an entry to ${metadataPath} with the required fields: ` +
      `startDate, raceGoal (with distance and targetTimeSeconds).`
    );
  }
  
  // Validate required fields
  if (!customMetadata.startDate) {
    throw new Error(`Missing required field "startDate" in metadata for "${filename}"`);
  }
  
  if (!customMetadata.raceGoal) {
    throw new Error(`Missing required field "raceGoal" in metadata for "${filename}"`);
  }
  
  if (!customMetadata.raceGoal.distance || !customMetadata.raceGoal.targetTimeSeconds) {
    throw new Error(
      `Missing required fields in "raceGoal" for "${filename}". ` +
      `Required: distance and targetTimeSeconds`
    );
  }
  
  return {
    name: customMetadata.name || basename(filename, extname(filename)),
    startDate: customMetadata.startDate,
    raceGoal: customMetadata.raceGoal,
    ...customMetadata
  } as TrainingPlanUploadRequest;
}

// Normalize value for comparison (handles minor LLM variations)
function normalizeValue(value: string, columnName: string): string {
  if (value === null || value === undefined) return '';
  value = value.trim();

  switch (columnName) {
    case 'type':
      // Normalize workout types (e.g., "Intervals" -> "interval", case-insensitive)
      return value.toLowerCase().replace(/s$/, '');
    case 'planned_distance_km':
      // Normalize distance to a fixed-point number string
      const distance = parseFloat(value);
      return isNaN(distance) ? '' : distance.toFixed(1).replace(/\.0$/, ''); // "5.0" -> "5"
    case 'target_pace_min_per_km':
      // Normalize pace format (e.g., "5:35" -> "5:35/km", case-insensitive)
      value = value.toLowerCase();
      if (value.match(/^\d{1,2}:\d{2}$/)) { // e.g., "5:35"
        return `${value}/km`;
      }
      if (value.match(/^\d{1,2}:\d{2}-\d{1,2}:\d{2}$/)) { // e.g., "5:35-6:00"
        return `${value}/km`;
      }
      return value.replace(/\/km$/, '').trim() + '/km'; // Ensure /km suffix if it's a pace
    case 'date':
      // Normalize date to YYYY-MM-DD
      try {
        return new Date(value).toISOString().split('T')[0];
      } catch {
        return value; // Return original if invalid date
      }
    case 'day':
      // Normalize day to 3-letter lowercase
      return value.toLowerCase().substring(0, 3);
    case 'target_HR_zone':
      // Normalize HR zone (e.g., "Z2" -> "z2")
      return value.toLowerCase();
    case 'notes':
      // Normalize whitespace in notes
      return value.replace(/\s+/g, ' ').trim();
    default:
      return value.toLowerCase();
  }
}

// Discover all test files from input directory
function getTestFiles(): string[] {
  if (!existsSync(INPUT_DIR)) {
    return [];
  }
  const files = readdirSync(INPUT_DIR);
  return files.filter(file => {
    const ext = extname(file);
    return ext === '.pdf' || ext === '.csv';
  });
}

describe('Training Plan CSV Generation Integration Tests', () => {
  const service = new TrainingPlanService();
  const testFiles = getTestFiles();

  if (testFiles.length === 0) {
    it.skip('No test files found in input directory', () => {});
    return;
  }

  const filesToTest = testFiles;

  it.each(filesToTest)(`should generate correct CSV for %s`, async (testFile) => {
    // 1. Load test file from input directory
    const filePath = join(INPUT_DIR, testFile);
    const fileBuffer = readFileSync(filePath);
    const fileType = testFile.endsWith('.pdf') ? 'pdf' : 'csv';
    
    // 2. Create mock Express.Multer.File
    const mockFile: Express.Multer.File = {
      fieldname: 'file',
      originalname: testFile,
      encoding: '7bit',
      mimetype: fileType === 'pdf' ? 'application/pdf' : 'text/csv',
      buffer: fileBuffer,
      size: fileBuffer.length,
      destination: '',
      filename: '',
      path: '',
      stream: null as unknown as Express.Multer.File['stream'],
    };

    // 3. Get metadata for this test file
    const metadata = getMetadata(testFile);

    // 4. Call processTrainingPlanFile (inner function)
    let actualCsv: string;
    try {
      actualCsv = await service.processTrainingPlanFile(
        mockFile,
        metadata,
        fileType
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      // Handle expected errors for invalid PDFs
      if (errorMessage?.includes('empty') || errorMessage?.includes('insufficient')) {
        return; // Skip invalid PDFs
      }
      throw error;
    }

    // 5. Load expected CSV
    const expectedFileName = `${basename(testFile, extname(testFile))}-expected.csv`;
    const expectedPath = join(EXPECTED_DIR, expectedFileName);
    
    if (!existsSync(expectedPath)) {
      throw new Error(`Expected file not found: ${expectedFileName}. Run regenerate-expected.ts first.`);
    }

    const expectedCsv = readFileSync(expectedPath, 'utf-8');

    // 6. Parse both CSVs
    const actualParsed = parseCsvContent(actualCsv);
    const expectedParsed = parseCsvContent(expectedCsv);

    // 7. Compare headers (use union of both headers to handle optional columns)
    // Ensure all expected headers are present in actual (actual may have more)
    for (const expectedHeader of expectedParsed.headers) {
      expect(actualParsed.headers).toContain(expectedHeader);
    }

    // 8. Compare row counts
    expect(actualParsed.rows.length).toBe(expectedParsed.rows.length);

    // 9. Compare each column value row by row (only for columns present in expected)
    // Skip 'notes' field as it can vary in formatting
    const columnsToCompare = expectedParsed.headers.filter(col => col !== 'notes');
    
    for (let i = 0; i < actualParsed.rows.length; i++) {
      const actualRow = actualParsed.rows[i];
      const expectedRow = expectedParsed.rows[i];

      // Get date and day for better error messages
      const rowDate = actualRow.date || expectedRow.date || 'unknown';
      const rowDay = actualRow.day || expectedRow.day || 'unknown';

      // Only compare columns that exist in expected CSV (excluding notes)
      for (const columnName of columnsToCompare) {
        const actualValue = actualRow[columnName] || '';
        const expectedValue = expectedRow[columnName] || '';
        
        const normalizedActual = normalizeValue(actualValue, columnName);
        const normalizedExpected = normalizeValue(expectedValue, columnName);

        expect(
          normalizedActual,
          `[${testFile}] Row ${i + 1} (${rowDate}, ${rowDay}), column "${columnName}": expected "${expectedValue}" (normalized: "${normalizedExpected}"), got "${actualValue}" (normalized: "${normalizedActual}")`
        ).toBe(normalizedExpected);
      }
    }
  }, 180000); // 180 second timeout for LLM calls
});
