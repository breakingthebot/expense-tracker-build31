// src/utils/csvParser.ts
// Pure utility for parsing RFC 4180 CSV strings into rows of text columns.
// Connects to: src/services/csvImport.ts
// Created: 2026-07-18

/**
 * Parses a raw CSV string into a 2D array of cells.
 * Correctly handles:
 * - Comma delimiters
 * - Double-quote enclosed cells containing commas or line breaks
 * - Escaped double-quotes ("") within quoted cells
 */
export function parseCsvString(csvText: string): string[][] {
  const result: string[][] = [];
  const lines = csvText.split(/\r?\n/);
  let insideQuotes = false;
  let currentRow: string[] = [];
  let currentCell = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // If not inside quotes, skip completely blank lines
    if (!insideQuotes && !line.trim()) {
      continue;
    }

    if (!insideQuotes) {
      currentRow = [];
      currentCell = '';
    } else {
      // If we are inside quotes from a previous line break, append a newline character to the cell
      currentCell += '\n';
    }

    for (let j = 0; j < line.length; j++) {
      const char = line[j];

      if (char === '"') {
        if (insideQuotes && line[j + 1] === '"') {
          // Escaped double quote ("")
          currentCell += '"';
          j++; // Skip the next quote
        } else {
          // Toggle quote state
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        currentRow.push(currentCell.trim());
        currentCell = '';
      } else {
        currentCell += char;
      }
    }

    if (!insideQuotes) {
      currentRow.push(currentCell.trim());
      result.push(currentRow);
    }
  }

  return result;
}
