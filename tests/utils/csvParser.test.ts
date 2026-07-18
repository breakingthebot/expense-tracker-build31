// tests/utils/csvParser.test.ts
// Unit tests for the CSV string parser.
// Connects to: src/utils/csvParser.ts
// Created: 2026-07-18

import { parseCsvString } from '../../src/utils/csvParser';

describe('parseCsvString', () => {
  it('parses basic CSV rows correctly', () => {
    const csv = 'Date,Amount,Note\n2026-07-12,12.50,Lunch\n2026-07-13,200.00,Train';
    const result = parseCsvString(csv);
    expect(result).toEqual([
      ['Date', 'Amount', 'Note'],
      ['2026-07-12', '12.50', 'Lunch'],
      ['2026-07-13', '200.00', 'Train'],
    ]);
  });

  it('handles empty rows and lines safely', () => {
    const csv = 'Date,Amount,Note\n\n2026-07-12,12.50,Lunch\n\n';
    const result = parseCsvString(csv);
    expect(result).toEqual([
      ['Date', 'Amount', 'Note'],
      ['2026-07-12', '12.50', 'Lunch'],
    ]);
  });

  it('parses quote-enclosed cells containing commas', () => {
    const csv = 'Date,Category,Amount,Note\n2026-07-12,Food,15.00,"Coffee, tea, and cake"';
    const result = parseCsvString(csv);
    expect(result[1]).toEqual(['2026-07-12', 'Food', '15.00', 'Coffee, tea, and cake']);
  });

  it('parses quote-enclosed cells with escaped double quotes', () => {
    const csv = 'Date,Category,Amount,Note\n2026-07-12,Food,20.00,"Dinner at ""Joe\'s"""';
    const result = parseCsvString(csv);
    expect(result[1]).toEqual(['2026-07-12', 'Food', '20.00', 'Dinner at "Joe\'s"']);
  });

  it('parses quote-enclosed cells with embedded newline characters', () => {
    const csv = 'Date,Amount,Note\n2026-07-12,50.00,"Electric bill\nJuly invoice"';
    const result = parseCsvString(csv);
    expect(result).toEqual([
      ['Date', 'Amount', 'Note'],
      ['2026-07-12', '50.00', 'Electric bill\nJuly invoice'],
    ]);
  });
});
