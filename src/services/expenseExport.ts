// src/services/expenseExport.ts
// Handles writing CSV content to the device's temporary cache and triggering
// the native share sheet.
// Connects to: src/models/expense.ts, src/utils/csv.ts, src/utils/logger.ts
// Created: 2026-07-17

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Expense } from '../models/expense';
import { convertToCsv } from '../utils/csv';
import { logger } from '../utils/logger';

const SCOPE = 'expenseExport';

/**
 * Generates a CSV from the given list of expenses, writes it to a temporary file on the device,
 * and launches the platform's native share sheet.
 * Throws an Error with a user-facing message if conversion, writing, or sharing fails.
 */
export async function exportExpensesToCsv(
  expenses: Expense[],
  customFilenamePrefix?: string
): Promise<void> {
  if (expenses.length === 0) {
    throw new Error('There are no expenses to export.');
  }

  try {
    // 1. Convert to CSV content
    const csvContent = convertToCsv(expenses);

    // 2. Generate file path in the app's cache directory
    const timestamp = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
    const prefix = customFilenamePrefix?.trim() ? customFilenamePrefix.trim().replace(/[^a-zA-Z0-9_-]/g, '') : 'expenses_export';
    const filename = `${prefix}_${timestamp}.csv`;
    const fileUri = `${FileSystem.documentDirectory}${filename}`;

    // 3. Write CSV string to file
    await FileSystem.writeAsStringAsync(fileUri, csvContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    logger.info(SCOPE, 'CSV file written locally', { uri: fileUri });

    // 4. Verify sharing is supported on this device
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) {
      logger.warn(SCOPE, 'Sharing is not available on this device');
      throw new Error('Sharing is not supported on this device.');
    }

    // 5. Open native share dialog
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export Expenses',
      UTI: 'public.comma-separated-values-text', // iOS Uniform Type Identifier
    });
    logger.info(SCOPE, 'Native share dialog launched successfully');
  } catch (error) {
    logger.error(SCOPE, 'Failed to export expenses', { error: String(error) });
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred during export.');
  }
}
