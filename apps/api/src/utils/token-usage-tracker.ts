import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

import type { LanguageModelUsage } from "ai";

interface TokenUsageEntry {
  timestamp: string;
  modelName: string;
  filename: string;
  method: "text" | "vision";
  usage: LanguageModelUsage;
  metadata?: {
    startDate?: string;
    targetTimeSeconds?: number;
    textLength?: number;
    imageCount?: number;
  };
}

const TOKEN_USAGE_DIR = join(process.cwd(), "logs", "token-usage");
const TOKEN_USAGE_FILE = join(TOKEN_USAGE_DIR, "usage.jsonl");

/**
 * Save token usage data to a JSONL file (JSON Lines format)
 * Each line is a JSON object with token usage information
 * @param entry - Token usage entry to save
 */
export async function saveTokenUsage(entry: Omit<TokenUsageEntry, "timestamp">): Promise<void> {
  try {
    // Ensure directory exists
    await mkdir(TOKEN_USAGE_DIR, { recursive: true });

    // Create entry with timestamp
    const entryWithTimestamp: TokenUsageEntry = {
      ...entry,
      timestamp: new Date().toISOString(),
    };

    // Append to JSONL file (one JSON object per line)
    const line = JSON.stringify(entryWithTimestamp) + "\n";
    await writeFile(TOKEN_USAGE_FILE, line, { flag: "a" });
  } catch (error) {
    // Don't throw - token usage tracking shouldn't break the main flow
    console.error("Failed to save token usage:", error);
  }
}
