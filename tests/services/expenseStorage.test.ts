// tests/services/expenseStorage.test.ts
// Tests for the AsyncStorage-backed expense storage service.
// AsyncStorage itself is mocked (see package.json jest.setupFiles), so these
// tests never touch a real device or disk.
// Mirrors: src/services/expenseStorage.ts
// Created: 2026-07-12

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addExpense,
  deleteExpense,
  getAllExpenses,
  updateExpense,
  addExpensesBulk,
} from '../../src/services/expenseStorage';

const validInput = {
  amountCents: 1000,
  category: 'Food' as const,
  note: 'Coffee',
  date: '2026-07-10',
  type: 'expense' as const,
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('getAllExpenses', () => {
  it('returns an empty array when nothing has been saved', async () => {
    await expect(getAllExpenses()).resolves.toEqual([]);
  });

  it('returns saved expenses sorted by date, most recent first', async () => {
    await addExpense({ ...validInput, date: '2026-07-01' });
    await addExpense({ ...validInput, date: '2026-07-15' });
    await addExpense({ ...validInput, date: '2026-07-08' });

    const expenses = await getAllExpenses();
    expect(expenses.map((expense) => expense.date)).toEqual([
      '2026-07-15',
      '2026-07-08',
      '2026-07-01',
    ]);
  });
});

describe('addExpense', () => {
  it('saves a valid expense and assigns it an id and createdAt', async () => {
    const expense = await addExpense(validInput);
    expect(expense.id).toBeTruthy();
    expect(expense.createdAt).toBeTruthy();
    expect(expense.amountCents).toBe(1000);
    expect(expense.type).toBe('expense');

    const all = await getAllExpenses();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(expense.id);
  });

  it('trims whitespace from the note', async () => {
    const expense = await addExpense({ ...validInput, note: '  Coffee  ' });
    expect(expense.note).toBe('Coffee');
  });

  it('throws with a user-facing message and does not save on invalid input', async () => {
    await expect(addExpense({ ...validInput, amountCents: 0 })).rejects.toThrow(
      'Amount must be greater than $0.00.'
    );
    await expect(getAllExpenses()).resolves.toEqual([]);
  });
});

describe('updateExpense', () => {
  it('updates the fields and keeps the same id and createdAt', async () => {
    const original = await addExpense(validInput);
    const updated = await updateExpense(original.id, {
      amountCents: 2500,
      category: 'Housing',
      note: 'Rent',
      date: '2026-07-11',
      type: 'income',
    });

    expect(updated.id).toBe(original.id);
    expect(updated.createdAt).toBe(original.createdAt);
    expect(updated.amountCents).toBe(2500);
    expect(updated.category).toBe('Housing');
    expect(updated.note).toBe('Rent');
    expect(updated.date).toBe('2026-07-11');
    expect(updated.type).toBe('income');

    const all = await getAllExpenses();
    expect(all).toHaveLength(1);
    expect(all[0]).toEqual(updated);
  });

  it('trims whitespace from the note', async () => {
    const original = await addExpense(validInput);
    const updated = await updateExpense(original.id, { ...validInput, note: '  Rent  ' });
    expect(updated.note).toBe('Rent');
  });

  it('throws with a user-facing message and does not save on invalid input', async () => {
    const original = await addExpense(validInput);
    await expect(
      updateExpense(original.id, { ...validInput, amountCents: 0 })
    ).rejects.toThrow('Amount must be greater than $0.00.');

    const all = await getAllExpenses();
    expect(all[0].amountCents).toBe(validInput.amountCents);
  });

  it('throws when the id does not exist', async () => {
    await expect(updateExpense('does-not-exist', validInput)).rejects.toThrow(
      'That expense no longer exists.'
    );
  });
});

describe('deleteExpense', () => {
  it('removes the matching expense', async () => {
    const expense = await addExpense(validInput);
    await deleteExpense(expense.id);
    await expect(getAllExpenses()).resolves.toEqual([]);
  });

  it('is a no-op when the id does not exist', async () => {
    await addExpense(validInput);
    await deleteExpense('does-not-exist');
    const all = await getAllExpenses();
    expect(all).toHaveLength(1);
  });
});

describe('addExpensesBulk', () => {
  it('saves multiple transactions atomically', async () => {
    const inputs = [
      { amountCents: 500, category: 'Food', note: 'Apples', date: '2026-07-18', type: 'expense' as const },
      { amountCents: 12000, category: 'Utilities', note: 'Electricity', date: '2026-07-18', type: 'expense' as const },
      { amountCents: 50000, category: 'Other', note: 'Gift', date: '2026-07-18', type: 'income' as const },
    ];

    const result = await addExpensesBulk(inputs);
    expect(result).toHaveLength(3);
    expect(result[0].id).toBeTruthy();
    expect(result[0].createdAt).toBeTruthy();
    expect(result[2].type).toBe('income');

    const all = await getAllExpenses();
    expect(all).toHaveLength(3);
  });
});
