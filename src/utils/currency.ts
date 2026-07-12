// src/utils/currency.ts
// Converts between user-typed dollar strings and integer cents, and formats
// cents back into a display string. Keeping money as integer cents avoids
// floating-point rounding bugs when totals are summed for the monthly chart.
// Connects to: src/components/AddExpenseForm.tsx, src/components/ExpenseList.tsx
// Created: 2026-07-12

const DOLLARS_INPUT_PATTERN = /^\d+(\.\d{1,2})?$/;

/**
 * Parses a user-typed dollar amount (e.g. "12.5") into integer cents.
 * Returns null if the input is not a valid non-negative dollar amount.
 */
export function parseDollarsToCents(rawInput: string): number | null {
  const trimmed = rawInput.trim();
  if (!DOLLARS_INPUT_PATTERN.test(trimmed)) {
    return null;
  }

  const [dollarsPart, centsPart = ''] = trimmed.split('.');
  const paddedCents = centsPart.padEnd(2, '0');
  return Number(dollarsPart) * 100 + Number(paddedCents);
}

/** Formats integer cents as a localized USD currency string, e.g. "$12.50". */
export function formatCents(amountCents: number): string {
  return (amountCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
  });
}
