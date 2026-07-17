// tests/utils/csv.test.ts
// Unit tests for the CSV conversion utility.
// Connects to: src/utils/csv.ts
// Created: 2026-07-17

import { convertToCsv, escapeCsvCell } from '../../src/utils/csv';
import { Expense } from '../../src/models/expense';

describe('escapeCsvCell', () => {
  it('does not modify simple strings', () => {
    expect(escapeCsvCell('simple')).toBe('simple');
    expect(escapeCsvCell('12.50')).toBe('12.50');
  });

  it('encloses strings containing commas in quotes', () => {
    expect(escapeCsvCell('hello, world')).toBe('"hello, world"');
  });

  it('escapes and encloses double quotes', () => {
    expect(escapeCsvCell('a "quote" here')).toBe('"a ""quote"" here"');
  });

  it('encloses strings containing newlines', () => {
    expect(escapeCsvCell('line 1\nline 2')).toBe('"line 1\nline 2"');
  });
});

describe('convertToCsv', () => {
  it('returns only headers when the expense list is empty', () => {
    const result = convertToCsv([]);
    expect(result).toBe('ID,Date,Category,Amount,Note,CreatedAt');
  });

  it('correctly maps a list of expenses to CSV rows', () => {
    const expenses: Expense[] = [
      {
        id: 'id-1',
        amountCents: 1250,
        category: 'Food',
        note: 'Lunch with team',
        date: '2026-07-12',
        createdAt: '2026-07-12T12:00:00.000Z',
      },
      {
        id: 'id-2',
        amountCents: 20000,
        category: 'Transportation',
        note: 'Train ticket, "express"',
        date: '2026-07-13',
        createdAt: '2026-07-13T13:00:00.000Z',
      },
    ];

    const result = convertToCsv(expenses);
    const expectedLines = [
      'ID,Date,Category,Amount,Note,CreatedAt',
      'id-1,2026-07-12,Food,12.50,Lunch with team,2026-07-12T12:00:00.000Z',
      'id-2,2026-07-13,Transportation,200.00,"Train ticket, ""express""",2026-07-13T13:00:00.000Z',
    ];

    expect(result).toBe(expectedLines.join('\n'));
  });
});
