// tests/utils/date.test.ts
// Tests for the month-label formatter added for the monthly chart.
// Mirrors: src/utils/date.ts
// Created: 2026-07-12

import { formatMonthLabel } from '../../src/utils/date';

describe('formatMonthLabel', () => {
  it('formats a yyyy-mm key as a full month and year', () => {
    expect(formatMonthLabel('2026-07')).toBe('July 2026');
  });

  it('formats January correctly (no off-by-one on the month index)', () => {
    expect(formatMonthLabel('2026-01')).toBe('January 2026');
  });

  it('formats December correctly', () => {
    expect(formatMonthLabel('2026-12')).toBe('December 2026');
  });
});
