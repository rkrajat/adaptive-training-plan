#!/usr/bin/env tsx
/**
 * Regenerate expected CSV files for integration tests
 * Usage: tsx regenerate-expected.ts
 */

// Load environment variables first
import 'dotenv/config';

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'fs';
import { join, extname, basename } from 'path';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

import { TrainingPlanService } from '../../services/training-plan.service';
import type { TrainingPlanUploadRequest } from '../../types/api.types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TEST_DATA_DIR = __dirname;
const INPUT_DIR = join(TEST_DATA_DIR, 'input');
const EXPECTED_DIR = join(TEST_DATA_DIR, 'expected');

// Load metadata if it exists
let metadataConfig: Record<string, Partial<TrainingPlanUploadRequest>> = {};
const metadataPath = join(TEST_DATA_DIR, 'metadata.json');
if (existsSync(metadataPath)) {
  metadataConfig = JSON.parse(readFileSync(metadataPath, 'utf-8'));
}

// Get metadata for a test file (same logic as test file)
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

// Discover all test files from input directory
function getTestFiles(): string[] {
  const files = readdirSync(INPUT_DIR);
  return files.filter(file => {
    const ext = extname(file);
    return ext === '.pdf' || ext === '.csv';
  });
}

async function regenerateExpected() {
  // Ensure expected directory exists
  if (!existsSync(EXPECTED_DIR)) {
    mkdirSync(EXPECTED_DIR, { recursive: true });
  }

  const service = new TrainingPlanService();
  const testFiles = getTestFiles();

  // Process all test files (can be filtered for specific files)
  const filesToProcess = testFiles;

  console.log(`Found ${filesToProcess.length} test file(s) to process\n`);

  for (const testFile of filesToProcess) {
    try {
      console.log(`Processing: ${testFile}...`);
      
      // Skip invalid PDFs
      if (testFile.includes('RunKillarney2020-Half-Marathon-Training-Plan-Sub1.45-min.pdf')) {
        console.log(`  ⏭️  Skipping invalid PDF: ${testFile}`);
        continue;
      }

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

      // 4. Call processTrainingPlanFile
      const csvContent = await service.processTrainingPlanFile(
        mockFile,
        metadata,
        fileType
      );

      // 5. Write to expected directory
      const expectedFileName = `${basename(testFile, extname(testFile))}-expected.csv`;
      const expectedPath = join(EXPECTED_DIR, expectedFileName);
      writeFileSync(expectedPath, csvContent, 'utf-8');
      
      console.log(`  ✅ Generated: ${expectedFileName}`);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`  ❌ Error processing ${testFile}:`, errorMessage);
      if (errorMessage?.includes('empty') || errorMessage?.includes('insufficient')) {
        console.log(`  ⏭️  Skipping invalid PDF: ${testFile}`);
        continue;
      }
      throw error;
    }
  }

  console.log(`\n✅ Regeneration complete!`);
}

// Run regeneration
regenerateExpected().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
