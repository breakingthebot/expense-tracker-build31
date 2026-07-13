// tests/utils/currency.test.ts
// Tests for centsToInputString, added to pre-fill the amount field when
// editing an existing expense.
// Mirrors: src/utils/currency.ts
// Created: 2026-07-12

import { centsToInputString, parseDollarsToCents } from '../../src/utils/currency';

describe('centsToInputString', () => {
  it('formats whole dollars with two decimal places', () => {
    expect(centsToInputString(1000)).toBe('10.00');
  });

  it('formats cents without a currency symbol or thousands separator', () => {
    expect(centsToInputString(123456)).toBe('1234.56');
  });

  it('round-trips with parseDollarsToCents', () => {
    expect(parseDollarsToCents(centsToInputString(1250))).toBe(1250);
  });
});
