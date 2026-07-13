// src/utils/date.ts
// Small date helpers shared by the form (date picker), the list (display
// formatting), and the monthly chart (month label). Expense dates are
// stored as plain yyyy-mm-dd strings, deliberately independent of
// timezone/time-of-day.
// Connects to: src/components/AddExpenseForm.tsx, src/components/ExpenseList.tsx, src/components/MonthlyChart.tsx
// Created: 2026-07-12

/** Formats a Date as an ISO yyyy-mm-dd string, using the device's local time. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Returns today's date as an ISO yyyy-mm-dd string in the device's local time. */
export function todayIsoDate(): string {
  return toIsoDate(new Date());
}

/** Parses a yyyy-mm-dd string into a local-time Date (midnight, no timezone shift). */
export function parseIsoDate(isoDate: string): Date {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Formats a yyyy-mm-dd string as a short display date, e.g. "Jul 12, 2026". */
export function formatDisplayDate(isoDate: string): string {
  return parseIsoDate(isoDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/** Formats a yyyy-mm month key as a full month label, e.g. "July 2026". */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
