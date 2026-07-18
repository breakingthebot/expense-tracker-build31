// src/services/csvImport.ts
// Handles mapping case-insensitive headers, validating spreadsheet cells,
// collecting all row validation errors/warnings, and filtering duplicates.
// Connects to: src/models/expense.ts, src/utils/csvParser.ts
// Created: 2026-07-18

import { Expense, TransactionType } from '../models/expense';
import { parseCsvString } from '../utils/csvParser';

export interface RowProblem {
  rowNumber: number; // 1-indexed spreadsheet line number
  severity: 'error' | 'warning';
  message: string;
  actionNeeded: string;
}

export interface ValidatedTransaction {
  amountCents: number;
  category: string;
  note: string;
  date: string;
  type: TransactionType;
  originalRow: number;
}

export interface ValidationResult {
  problems: RowProblem[];
  validTransactions: ValidatedTransaction[];
  hasErrors: boolean;
  importedCategories: string[]; // List of categories seen in CSV that need to be seeded
}

const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_NOTE_LENGTH = 200;

/**
 * Validates a CSV string against the existing list of transactions and category names.
 * Collects all errors and warnings, ensuring partial duplicates are flagged and
 * bad rows block the batch, complying with AGENTS.md spreadsheet standards.
 */
export function validateCsvImport(
  csvContent: string,
  existingExpenses: Expense[],
  existingCategoryNames: string[]
): ValidationResult {
  const problems: RowProblem[] = [];
  const validTransactions: ValidatedTransaction[] = [];
  const importedCategories = new Set<string>();

  // 1. Parse CSV string into 2D row array
  const rows = parseCsvString(csvContent);
  if (rows.length === 0) {
    return {
      problems: [
        {
          rowNumber: 1,
          severity: 'error',
          message: 'The uploaded file is empty.',
          actionNeeded: 'Please choose a CSV file with valid transaction records.',
        },
      ],
      validTransactions: [],
      hasErrors: true,
      importedCategories: [],
    };
  }

  // 2. Map header indices case-insensitively
  const headers = rows[0].map((h) => h.toLowerCase().trim());
  
  const dateIdx = headers.findIndex((h) => h.includes('date'));
  const amountIdx = headers.findIndex((h) => h.includes('amount') || h.includes('value'));
  const categoryIdx = headers.findIndex((h) => h.includes('category'));
  const noteIdx = headers.findIndex((h) => h.includes('note') || h.includes('description') || h.includes('memo'));
  const typeIdx = headers.findIndex((h) => h.includes('type'));

  if (dateIdx === -1 || amountIdx === -1 || categoryIdx === -1) {
    const missing: string[] = [];
    if (dateIdx === -1) missing.push("'Date'");
    if (amountIdx === -1) missing.push("'Amount'");
    if (categoryIdx === -1) missing.push("'Category'");

    return {
      problems: [
        {
          rowNumber: 1,
          severity: 'error',
          message: `Required columns are missing: ${missing.join(', ')}.`,
          actionNeeded: "Ensure the first row of your CSV has headers named 'Date', 'Amount', and 'Category'.",
        },
      ],
      validTransactions: [],
      hasErrors: true,
      importedCategories: [],
    };
  }

  // 3. Prepare deduplication index maps
  const existingKeys = new Set<string>();
  existingExpenses.forEach((e) => {
    const type = e.type ?? 'expense';
    const key = `${e.date}_${e.amountCents}_${e.category.toLowerCase()}_${e.note.toLowerCase()}_${type}`;
    existingKeys.add(key);
  });

  const batchKeys = new Set<string>();
  const lowerCategoryNames = new Set(existingCategoryNames.map((n) => n.toLowerCase()));

  // 4. Validate rows (line numbers are index + 1)
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 1;

    // Skip empty lines safely
    const isRowEmpty = row.length === 0 || (row.length === 1 && !row[0].trim());
    if (isRowEmpty) {
      continue;
    }

    const dateCell = row[dateIdx] || '';
    const amountCell = row[amountIdx] || '';
    const categoryCell = row[categoryIdx] || '';
    const noteCell = noteIdx !== -1 ? row[noteIdx] || '' : '';
    const typeCell = typeIdx !== -1 ? row[typeIdx] || '' : '';

    let hasRowErrors = false;

    // Validate Amount
    let amountCents = 0;
    let inferredType: TransactionType = 'expense';
    const cleanedAmount = amountCell.replace(/[$,]/g, '').trim();

    if (cleanedAmount.startsWith('-')) {
      inferredType = 'expense';
    } else if (cleanedAmount.startsWith('+')) {
      inferredType = 'income';
    }

    const absAmount = cleanedAmount.replace(/[+-]/g, '').trim();
    const amountVal = parseFloat(absAmount);

    if (Number.isNaN(amountVal) || amountVal <= 0) {
      problems.push({
        rowNumber: rowNum,
        severity: 'error',
        message: `Invalid transaction amount: "${amountCell}".`,
        actionNeeded: 'Change the amount cell to a valid positive decimal value (e.g. 12.50).',
      });
      hasRowErrors = true;
    } else {
      amountCents = Math.round(amountVal * 100);
    }

    // Validate Date
    const trimmedDate = dateCell.trim();
    if (!ISO_DATE_PATTERN.test(trimmedDate) || Number.isNaN(new Date(trimmedDate).getTime())) {
      problems.push({
        rowNumber: rowNum,
        severity: 'error',
        message: `Invalid date format: "${dateCell}".`,
        actionNeeded: "Change date cell to YYYY-MM-DD format (e.g. 2026-07-18).",
      });
      hasRowErrors = true;
    }

    // Process Category
    const trimmedCategory = categoryCell.trim();
    let finalCategory = 'Other';
    if (trimmedCategory) {
      finalCategory = trimmedCategory;
      if (!lowerCategoryNames.has(trimmedCategory.toLowerCase())) {
        problems.push({
          rowNumber: rowNum,
          severity: 'warning',
          message: `Category "${trimmedCategory}" does not exist in your database.`,
          actionNeeded: 'This category will be automatically created on import.',
        });
        importedCategories.add(trimmedCategory);
      }
    }

    // Process Note
    let finalNote = noteCell.trim();
    if (finalNote.length > MAX_NOTE_LENGTH) {
      finalNote = finalNote.substring(0, MAX_NOTE_LENGTH);
      problems.push({
        rowNumber: rowNum,
        severity: 'warning',
        message: 'Note exceeds 200 characters limit.',
        actionNeeded: 'Note will be automatically truncated.',
      });
    }

    // Process Transaction Type
    let finalType: TransactionType = inferredType;
    const cleanType = typeCell.trim().toLowerCase();
    if (cleanType === 'income' || cleanType === 'expense') {
      finalType = cleanType as TransactionType;
    } else if (cleanType !== '') {
      problems.push({
        rowNumber: rowNum,
        severity: 'warning',
        message: `Unknown transaction type value "${typeCell}".`,
        actionNeeded: `Will default to transaction mode "${inferredType}".`,
      });
    }

    // If row has formatting errors, block deduplication checks and skip adding it
    if (hasRowErrors) {
      continue;
    }

    // Deduplication Checks
    const compKey = `${trimmedDate}_${amountCents}_${finalCategory.toLowerCase()}_${finalNote.toLowerCase()}_${finalType}`;
    if (existingKeys.has(compKey)) {
      problems.push({
        rowNumber: rowNum,
        severity: 'warning',
        message: 'Duplicate record already exists in database.',
        actionNeeded: 'This row will be skipped to prevent double-logging.',
      });
    } else if (batchKeys.has(compKey)) {
      problems.push({
        rowNumber: rowNum,
        severity: 'warning',
        message: 'Duplicate record row detected within CSV file.',
        actionNeeded: 'This duplicate row will be skipped.',
      });
    } else {
      batchKeys.add(compKey);
      validTransactions.push({
        amountCents,
        category: finalCategory,
        note: finalNote,
        date: trimmedDate,
        type: finalType,
        originalRow: rowNum,
      });
    }
  }

  const hasErrors = problems.some((p) => p.severity === 'error');

  return {
    problems,
    validTransactions,
    hasErrors,
    importedCategories: Array.from(importedCategories),
  };
}
