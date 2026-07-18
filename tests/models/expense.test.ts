// tests/models/expense.test.ts
// Tests for expense/transaction validation rules.
// Mirrors: src/models/expense.ts
// Created: 2026-07-12

import { validateNewExpense } from '../../src/models/expense';

const validInput = {
  amountCents: 1250,
  category: 'Food' as const,
  note: 'Lunch',
  date: '2026-07-12',
  type: 'expense' as const,
};

describe('validateNewExpense', () => {
  it('returns no errors for valid input', () => {
    expect(validateNewExpense(validInput)).toEqual([]);
    expect(validateNewExpense({ ...validInput, type: 'income' })).toEqual([]);
    expect(validateNewExpense({ ...validInput, type: undefined })).toEqual([]);
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

  it('rejects an empty category', () => {
    const errors = validateNewExpense({ ...validInput, category: '' });
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

  it('rejects an invalid transaction type value', () => {
    const errors = validateNewExpense({ ...validInput, type: 'invalid-type' as any });
    expect(errors).toContain('Transaction type must be either expense or income.');
  });

  it('collects multiple errors at once', () => {
    const errors = validateNewExpense({
      amountCents: 0,
      category: '',
      note: '',
      date: 'not-a-date',
      type: 'bad' as any,
    });
    expect(errors.length).toBe(4);
  });
});
