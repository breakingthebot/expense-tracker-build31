// src/utils/csv.ts
// Pure utility for converting an array of Expense objects into a formatted CSV string.
// Connects to: src/models/expense.ts, src/services/expenseExport.ts
// Created: 2026-07-17

import { Expense } from '../models/expense';

/**
 * Escapes a single CSV cell value according to RFC 4180 standards:
 * - If the value contains commas, double quotes, or newlines, it must be enclosed in double quotes.
 * - Any double quotes inside the value must be escaped by prefixing them with another double quote (i.e. doubled).
 */
export function escapeCsvCell(value: string): string {
  const needsQuotes = value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r');
  let escaped = value;
  if (value.includes('"')) {
    escaped = value.replace(/"/g, '""');
  }
  if (needsQuotes) {
    return `"${escaped}"`;
  }
  return escaped;
}

/**
 * Converts a list of Expense objects into a standardized CSV string.
 * Format: ID,Date,Category,Amount,Note,CreatedAt
 */
export function convertToCsv(expenses: Expense[]): string {
  const headers = ['ID', 'Date', 'Category', 'Amount', 'Note', 'CreatedAt'];
  const rows = expenses.map((expense) => {
    const amountFormatted = (expense.amountCents / 100).toFixed(2);
    return [
      escapeCsvCell(expense.id),
      escapeCsvCell(expense.date),
      escapeCsvCell(expense.category),
      escapeCsvCell(amountFormatted),
      escapeCsvCell(expense.note),
      escapeCsvCell(expense.createdAt),
    ].join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}
