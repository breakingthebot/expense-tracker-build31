// tests/services/expenseExport.test.ts
// Unit tests for the CSV export service.
// Connects to: src/services/expenseExport.ts
// Created: 2026-07-17

import { exportExpensesToCsv } from '../../src/services/expenseExport';
import { Expense } from '../../src/models/expense';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// Mock FileSystem and Sharing
jest.mock('expo-file-system/legacy', () => ({
  documentDirectory: 'mock-directory/',
  writeAsStringAsync: jest.fn(),
  EncodingType: {
    UTF8: 'utf8',
  },
}));

jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(),
  shareAsync: jest.fn(),
}));

describe('exportExpensesToCsv', () => {
  const mockExpenses: Expense[] = [
    {
      id: 'id-1',
      amountCents: 1250,
      category: 'Food',
      note: 'Lunch',
      date: '2026-07-12',
      createdAt: '2026-07-12T12:00:00.000Z',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws an error if there are no expenses to export', async () => {
    await expect(exportExpensesToCsv([])).rejects.toThrow('There are no expenses to export.');
  });

  it('converts to CSV, writes to file, and shares successfully when available', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(true);
    (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);
    (Sharing.shareAsync as jest.Mock).mockResolvedValue(undefined);

    await expect(exportExpensesToCsv(mockExpenses)).resolves.not.toThrow();

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      expect.stringContaining('mock-directory/expenses_export_'),
      expect.stringContaining('ID,Date,Category,Amount,Note,CreatedAt'),
      expect.objectContaining({ encoding: 'utf8' })
    );

    expect(Sharing.isAvailableAsync).toHaveBeenCalled();
    expect(Sharing.shareAsync).toHaveBeenCalledWith(
      expect.stringContaining('mock-directory/expenses_export_'),
      expect.objectContaining({
        mimeType: 'text/csv',
        dialogTitle: 'Export Expenses',
      })
    );
  });

  it('throws an error if sharing is not available on the device', async () => {
    (Sharing.isAvailableAsync as jest.Mock).mockResolvedValue(false);
    (FileSystem.writeAsStringAsync as jest.Mock).mockResolvedValue(undefined);

    await expect(exportExpensesToCsv(mockExpenses)).rejects.toThrow('Sharing is not supported on this device.');

    expect(FileSystem.writeAsStringAsync).toHaveBeenCalled();
    expect(Sharing.shareAsync).not.toHaveBeenCalled();
  });

  it('throws an error if writing to file fails', async () => {
    (FileSystem.writeAsStringAsync as jest.Mock).mockRejectedValue(new Error('Disk write failed'));

    await expect(exportExpensesToCsv(mockExpenses)).rejects.toThrow('Disk write failed');
    expect(Sharing.isAvailableAsync).not.toHaveBeenCalled();
  });
});
