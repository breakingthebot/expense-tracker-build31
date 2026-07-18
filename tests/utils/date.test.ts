// tests/utils/date.test.ts
// Tests for the date helpers, including the ones added for the editable
// date picker (toIsoDate, parseIsoDate).
// Mirrors: src/utils/date.ts
// Created: 2026-07-12

import {
  formatDisplayDate,
  formatMonthLabel,
  parseIsoDate,
  shiftMonthKey,
  toIsoDate,
  getThisWeekRange,
  getLast7DaysRange,
  getThisMonthRange,
} from '../../src/utils/date';

describe('toIsoDate', () => {
  it('formats a Date as yyyy-mm-dd', () => {
    expect(toIsoDate(new Date(2026, 6, 12))).toBe('2026-07-12');
  });

  it('pads single-digit months and days', () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('parseIsoDate', () => {
  it('parses a yyyy-mm-dd string into the matching local date', () => {
    const date = parseIsoDate('2026-07-12');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(6);
    expect(date.getDate()).toBe(12);
  });

  it('round-trips with toIsoDate', () => {
    expect(toIsoDate(parseIsoDate('2026-01-05'))).toBe('2026-01-05');
  });
});

describe('formatDisplayDate', () => {
  it('formats a yyyy-mm-dd string as a short display date', () => {
    expect(formatDisplayDate('2026-07-12')).toBe('Jul 12, 2026');
  });
});

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

describe('shiftMonthKey', () => {
  it('goes back one month within the same year', () => {
    expect(shiftMonthKey('2026-07', -1)).toBe('2026-06');
  });

  it('goes forward one month within the same year', () => {
    expect(shiftMonthKey('2026-07', 1)).toBe('2026-08');
  });

  it('rolls back over a year boundary', () => {
    expect(shiftMonthKey('2026-01', -1)).toBe('2025-12');
  });

  it('rolls forward over a year boundary', () => {
    expect(shiftMonthKey('2026-12', 1)).toBe('2027-01');
  });

  it('supports multi-month deltas', () => {
    expect(shiftMonthKey('2026-07', -8)).toBe('2025-11');
  });

  it('is a no-op with a delta of 0', () => {
    expect(shiftMonthKey('2026-07', 0)).toBe('2026-07');
  });
});

describe('date ranges', () => {
  it('calculates Mon-Sun week range correctly', () => {
    // 2026-07-18 is a Saturday. Monday of that week is 2026-07-13. Sunday is 2026-07-19.
    const week = getThisWeekRange('2026-07-18');
    expect(week.start).toBe('2026-07-13');
    expect(week.end).toBe('2026-07-19');
  });

  it('calculates last 7 days range correctly', () => {
    const range = getLast7DaysRange('2026-07-18');
    expect(range.start).toBe('2026-07-12');
    expect(range.end).toBe('2026-07-18');
  });

  it('calculates month range correctly', () => {
    const range = getThisMonthRange('2026-07-18');
    expect(range.start).toBe('2026-07-01');
    expect(range.end).toBe('2026-07-31');
  });
});
