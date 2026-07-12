// tests/models/expense.test.ts
// Tests for expense validation rules.
// Mirrors: src/models/expense.ts
// Created: 2026-07-12

import { validateNewExpense } from '../../src/models/expense';

const validInput = {
  amountCents: 1250,
  category: 'Food' as const,
  note: 'Lunch',
  date: '2026-07-12',
};

describe('validateNewExpense', () => {
  it('returns no errors for valid input', () => {
    expect(validateNewExpense(validInput)).toEqual([]);
  });

  it('rejects a zero amount', () => {
    const errors = validateNewExpense({ ...validInput, amountCents: 0 });
    expect(errors).toContain('Amount must be greater than $0.00.');
  });

  it('rejects a negative amount', () => {
    const errors = validateNewExpense({ ...validInput, amountCents: -500 });
    expect(errors).toContain('Amount must be greater than $0.00.');
  });

  it('rejects a non-integer amount', () => {
    const errors = validateNewExpense({ ...validInput, amountCents: 12.5 });
    expect(errors).toContain('Amount must be greater than $0.00.');
  });

  it('rejects an unknown category', () => {
    // @ts-expect-error deliberately invalid category for the test
    const errors = validateNewExpense({ ...validInput, category: 'NotACategory' });
    expect(errors).toContain('Please choose a valid category.');
  });

  it('rejects a malformed date', () => {
    const errors = validateNewExpense({ ...validInput, date: '07/12/2026' });
    expect(errors).toContain('Please choose a valid date.');
  });

  it('rejects a note over 200 characters', () => {
    const errors = validateNewExpense({ ...validInput, note: 'x'.repeat(201) });
    expect(errors).toContain('Note must be 200 characters or fewer.');
  });

  it('collects multiple errors at once', () => {
    const errors = validateNewExpense({
      amountCents: 0,
      // @ts-expect-error deliberately invalid category for the test
      category: 'Nope',
      note: '',
      date: 'not-a-date',
    });
    expect(errors.length).toBe(3);
  });
});
