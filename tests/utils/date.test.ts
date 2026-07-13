// tests/utils/date.test.ts
// Tests for the date helpers, including the ones added for the editable
// date picker (toIsoDate, parseIsoDate).
// Mirrors: src/utils/date.ts
// Created: 2026-07-12

import { formatDisplayDate, formatMonthLabel, parseIsoDate, toIsoDate } from '../../src/utils/date';

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
