/**
 * Parsed markdown table structure
 */
export interface ParsedMarkdownTable {
  headers: string[];
  rows: Record<string, string>[];
}

/**
 * Normalize a header string by removing extra whitespace and converting to lowercase
 */
const normalizeHeader = (header: string): string => {
  return header.trim().toLowerCase();
};

/**
 * Parse a single markdown table row into cells
 * Handles the pipe-delimited format: | cell1 | cell2 | cell3 |
 */
const parseTableRow = (row: string): string[] => {
  // Remove leading/trailing pipes and whitespace
  const trimmed = row.trim();

  // Split by pipe and filter out empty strings from leading/trailing pipes
  const cells = trimmed
    .split("|")
    .map((cell) => cell.trim())
    .filter((_, index, arr) => {
      // Filter out empty strings at start and end caused by leading/trailing pipes
      return index !== 0 || arr[0] !== "";
    });

  // Remove first and last elements if they're empty (from leading/trailing pipes)
  if (cells.length > 0 && cells[0] === "") {
    cells.shift();
  }
  if (cells.length > 0 && cells[cells.length - 1] === "") {
    cells.pop();
  }

  return cells;
};

/**
 * Check if a row is a separator row (contains only dashes and pipes)
 * Example: |------|------|------|
 */
const isSeparatorRow = (row: string): boolean => {
  const trimmed = row.trim();
  // A separator row contains only pipes, dashes, colons (for alignment), and whitespace
  return /^[\|\-:\s]+$/.test(trimmed) && trimmed.includes("-");
};

/**
 * Parse a markdown table string into structured data
 *
 * @param tableMarkdown - The markdown table string
 * @returns Parsed table with headers and rows, or null if parsing fails
 *
 * @example
 * const markdown = `
 * | Date | Day | Run Type |
 * |------|-----|----------|
 * | 2025-01-01 | Mon | Easy |
 * `;
 * const result = parseMarkdownTable(markdown);
 * // { headers: ['Date', 'Day', 'Run Type'], rows: [{ Date: '2025-01-01', Day: 'Mon', 'Run Type': 'Easy' }] }
 */
export const parseMarkdownTable = (
  tableMarkdown: string
): ParsedMarkdownTable | null => {
  if (!tableMarkdown || tableMarkdown.trim().length === 0) {
    return null;
  }

  // Split into lines and filter out empty lines
  const lines = tableMarkdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && line.includes("|"));

  if (lines.length < 2) {
    return null; // Need at least header and separator
  }

  // Find the header row (first non-separator row with pipes)
  let headerIndex = 0;
  while (headerIndex < lines.length && isSeparatorRow(lines[headerIndex])) {
    headerIndex++;
  }

  if (headerIndex >= lines.length) {
    return null; // No header found
  }

  const headers = parseTableRow(lines[headerIndex]);

  if (headers.length === 0) {
    return null;
  }

  // Find where data rows start (after the separator row following headers)
  let dataStartIndex = headerIndex + 1;
  while (dataStartIndex < lines.length && isSeparatorRow(lines[dataStartIndex])) {
    dataStartIndex++;
  }

  // Parse data rows
  const rows: Record<string, string>[] = [];

  for (let idx = dataStartIndex; idx < lines.length; idx++) {
    const line = lines[idx];

    // Skip separator rows
    if (isSeparatorRow(line)) {
      continue;
    }

    const cells = parseTableRow(line);

    // Create row object mapping headers to values
    const rowObj: Record<string, string> = {};
    headers.forEach((header, cellIndex) => {
      rowObj[header] = cells[cellIndex] || "";
    });

    rows.push(rowObj);
  }

  return {
    headers,
    rows,
  };
};

/**
 * Extract the "Modified Training Plan" table from LLM markdown output
 *
 * The LLM outputs markdown in this format:
 * ### Modified Training Plan
 * | Date | Day | Run Type | Distance (km) | Target Pace (min/km) | Target HR Zone | Notes |
 * |------|-----|----------|---------------|---------------------|----------------|-------|
 * | ... | ... | ... | ... | ... | ... | ... |
 *
 * @param markdown - Full markdown output from LLM
 * @returns Parsed table or null if not found
 */
export const extractModifiedPlanTable = (
  markdown: string
): ParsedMarkdownTable | null => {
  if (!markdown || markdown.trim().length === 0) {
    return null;
  }

  // Find the "Modified Training Plan" section
  // Look for the header pattern (with or without emoji)
  const modifiedPlanPatterns = [
    /###?\s*\ud83d\uddd3\ufe0f?\s*Modified Training Plan/i,
    /###?\s*Modified Training Plan/i,
    /###?\s*Weekly Training Plan/i,
  ];

  let sectionStart = -1;
  for (const pattern of modifiedPlanPatterns) {
    const match = markdown.match(pattern);
    if (match && match.index !== undefined) {
      sectionStart = match.index;
      break;
    }
  }

  if (sectionStart === -1) {
    // If no specific header found, try to find any table in the markdown
    const tableMatch = markdown.match(/\|[^\n]+\|[\s\S]*?\|[^\n]+\|/);
    if (tableMatch) {
      return parseMarkdownTable(tableMatch[0]);
    }
    return null;
  }

  // Extract content from the section start until the next major section or end
  const contentAfterHeader = markdown.slice(sectionStart);

  // Find the end of this section (next ### header or end of content)
  const nextSectionMatch = contentAfterHeader
    .slice(1) // Skip the first character to avoid matching the current header
    .match(/\n###?\s+[^\n]/);

  const sectionContent = nextSectionMatch
    ? contentAfterHeader.slice(0, nextSectionMatch.index! + 1)
    : contentAfterHeader;

  // Find the table within this section
  const tableLines: string[] = [];
  const lines = sectionContent.split("\n");
  let inTable = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check if this line looks like a table row
    if (trimmedLine.startsWith("|") && trimmedLine.endsWith("|")) {
      inTable = true;
      tableLines.push(trimmedLine);
    } else if (inTable && trimmedLine.length === 0) {
      // Empty line might end the table, but continue to check
      continue;
    } else if (inTable && !trimmedLine.startsWith("|")) {
      // Non-table content after table started - end of table
      break;
    }
  }

  if (tableLines.length < 2) {
    return null;
  }

  return parseMarkdownTable(tableLines.join("\n"));
};

/**
 * Header mapping from LLM output to original plan schema
 * Maps various header formats to normalized keys
 */
export const HEADER_MAPPINGS: Record<string, string[]> = {
  date: ["date", "Date"],
  day: ["day", "Day"],
  runType: [
    "run type",
    "Run Type",
    "type",
    "Type",
    "planned_run_type",
    "Planned Run Type",
  ],
  distance: [
    "distance (km)",
    "Distance (km)",
    "distance",
    "Distance",
    "planned_distance_km",
    "Planned Distance Km",
  ],
  pace: [
    "target pace (min/km)",
    "Target Pace (min/km)",
    "target_pace_min_per_km",
    "Target Pace Min Per Km",
    "pace",
    "Pace",
  ],
  hrZone: [
    "target hr zone",
    "Target HR Zone",
    "target_hr_zone",
    "Target Hr Zone",
    "hr zone",
    "HR Zone",
  ],
  notes: ["notes", "Notes"],
};

/**
 * Find the matching header from a table using header mappings
 */
export const findMatchingHeader = (
  headers: string[],
  key: keyof typeof HEADER_MAPPINGS
): string | null => {
  const possibleNames = HEADER_MAPPINGS[key];

  for (const header of headers) {
    const normalizedHeader = normalizeHeader(header);
    for (const possibleName of possibleNames) {
      if (normalizedHeader === normalizeHeader(possibleName)) {
        return header;
      }
    }
  }

  return null;
};
