// tests/services/csvImport.test.ts
// Unit tests for CSV validation and import processing services.
// Connects to: src/services/csvImport.ts
// Created: 2026-07-18

import { validateCsvImport } from '../../src/services/csvImport';
import { Expense } from '../../src/models/expense';

describe('validateCsvImport', () => {
  const existingExpenses: Expense[] = [
    {
      id: '1',
      amountCents: 1250,
      category: 'Food',
      note: 'Lunch',
      date: '2026-07-12',
      createdAt: '',
      type: 'expense',
    },
  ];
  const existingCategories = ['Food', 'Utilities', 'Other'];

  it('rejects empty files', () => {
    const result = validateCsvImport('', existingExpenses, existingCategories);
    expect(result.hasErrors).toBe(true);
    expect(result.problems[0].message).toContain('uploaded file is empty');
  });

  it('rejects missing header columns', () => {
    const csv = 'Date,Amount\n2026-07-12,12.50';
    const result = validateCsvImport(csv, existingExpenses, existingCategories);
    expect(result.hasErrors).toBe(true);
    expect(result.problems[0].message).toContain('Required columns are missing');
  });

  it('maps headers and accepts valid transactions', () => {
    const csv = 'Date,Category,Amount,Note,Type\n2026-07-18,Utilities,50.00,Power bill,expense';
    const result = validateCsvImport(csv, existingExpenses, existingCategories);
    expect(result.hasErrors).toBe(false);
    expect(result.problems).toHaveLength(0);
    expect(result.validTransactions).toEqual([
      {
        amountCents: 5000,
        category: 'Utilities',
        note: 'Power bill',
        date: '2026-07-18',
        type: 'expense',
        originalRow: 2,
      },
    ]);
  });

  it('flags malformed amounts and dates as blocking errors', () => {
    const csv = 'Date,Category,Amount\nnot-a-date,Food,12.50\n2026-07-18,Food,bad-amount';
    const result = validateCsvImport(csv, existingExpenses, existingCategories);
    expect(result.hasErrors).toBe(true);
    expect(result.problems.filter((p) => p.severity === 'error')).toHaveLength(2);
    expect(result.validTransactions).toHaveLength(0);
  });

  it('flags unknown categories with warnings but allows import', () => {
    const csv = 'Date,Category,Amount\n2026-07-18,Gym,45.00';
    const result = validateCsvImport(csv, existingExpenses, existingCategories);
    expect(result.hasErrors).toBe(false);
    expect(result.problems[0].severity).toBe('warning');
    expect(result.problems[0].message).toContain('Category "Gym" does not exist');
    expect(result.importedCategories).toEqual(['Gym']);
    expect(result.validTransactions).toHaveLength(1);
  });

  it('filters duplicate records already in database', () => {
    const csv = 'Date,Category,Amount,Note,Type\n2026-07-12,Food,12.50,Lunch,expense';
    const result = validateCsvImport(csv, existingExpenses, existingCategories);
    expect(result.hasErrors).toBe(false);
    expect(result.problems[0].severity).toBe('warning');
    expect(result.problems[0].message).toContain('Duplicate record already exists');
    expect(result.validTransactions).toHaveLength(0);
  });

  it('filters duplicates within the CSV batch itself', () => {
    const csv = 'Date,Category,Amount,Note\n2026-07-18,Utilities,50.00,Gas\n2026-07-18,Utilities,50.00,Gas';
    const result = validateCsvImport(csv, existingExpenses, existingCategories);
    expect(result.hasErrors).toBe(false);
    expect(result.problems).toHaveLength(1);
    expect(result.problems[0].message).toContain('Duplicate record row detected');
    expect(result.validTransactions).toHaveLength(1); // Only imports the first instance
  });
});
