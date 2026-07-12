// src/utils/date.ts
// Small date helpers shared by the form (default date), the list (display
// formatting), and the monthly chart (month label). Expense dates are
// stored as plain yyyy-mm-dd strings, deliberately independent of
// timezone/time-of-day.
// Connects to: src/components/AddExpenseForm.tsx, src/components/ExpenseList.tsx, src/components/MonthlyChart.tsx
// Created: 2026-07-12

/** Returns today's date as an ISO yyyy-mm-dd string in the device's local time. */
export function todayIsoDate(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Formats a yyyy-mm-dd string as a short display date, e.g. "Jul 12, 2026". */
export function formatDisplayDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Formats a yyyy-mm month key as a full month label, e.g. "July 2026". */
export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
