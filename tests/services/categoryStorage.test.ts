// tests/services/categoryStorage.test.ts
// Unit tests for the dynamic category storage service.
// Connects to: src/services/categoryStorage.ts
// Created: 2026-07-18

import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCategories, addCategory, renameCategory, deleteCategory } from '../../src/services/categoryStorage';
import { Expense } from '../../src/models/expense';
import { RecurringExpense } from '../../src/models/recurring';

describe('categoryStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('seeds default categories on first load', async () => {
    const list = await getCategories();
    expect(list).toHaveLength(8);
    expect(list.find((c) => c.name === 'Food')).toBeDefined();
    expect(list.find((c) => c.name === 'Other')?.isSystem).toBe(true);
  });

  it('adds a new category successfully and validates duplication', async () => {
    const seed = await getCategories();
    expect(seed).toHaveLength(8);

    const added = await addCategory('Subscriptions', '#00a8cc');
    expect(added.name).toBe('Subscriptions');
    expect(added.color).toBe('#00a8cc');

    const updated = await getCategories();
    expect(updated).toHaveLength(9);

    // Should throw if name already exists (case-insensitive)
    await expect(addCategory('subscriptions', '#111')).rejects.toThrow();
  });

  it('cascades renaming updates to existing expenses and recurring schedules', async () => {
    // Setup categories
    const categories = await getCategories();
    const foodCat = categories.find((c) => c.name === 'Food')!;

    // Setup associated mock expense & schedule
    const mockExpenses: Expense[] = [
      { id: 'exp-1', amountCents: 500, category: 'Food', note: 'Apples', date: '2026-07-18', createdAt: '' },
      { id: 'exp-2', amountCents: 800, category: 'Housing', note: 'Rent', date: '2026-07-18', createdAt: '' },
    ];
    const mockSchedules: RecurringExpense[] = [
      {
        id: 'rec-1',
        amountCents: 500,
        category: 'Food',
        note: 'Fruit of the month',
        interval: 'monthly',
        startDate: '2026-07-18',
        lastGeneratedDate: null,
        createdAt: '',
      },
    ];

    await AsyncStorage.setItem('@expense_tracker/expenses', JSON.stringify(mockExpenses));
    await AsyncStorage.setItem('@expense_tracker/recurring_schedules', JSON.stringify(mockSchedules));

    // Rename 'Food' to 'Groceries'
    await renameCategory(foodCat.id, 'Groceries');

    // Verify categories updated
    const freshCats = await getCategories();
    expect(freshCats.find((c) => c.id === foodCat.id)!.name).toBe('Groceries');

    // Verify expense cascaded
    const rawExp = await AsyncStorage.getItem('@expense_tracker/expenses');
    const freshExp: Expense[] = JSON.parse(rawExp!);
    expect(freshExp.find((e) => e.id === 'exp-1')!.category).toBe('Groceries');
    expect(freshExp.find((e) => e.id === 'exp-2')!.category).toBe('Housing');

    // Verify schedule cascaded
    const rawRec = await AsyncStorage.getItem('@expense_tracker/recurring_schedules');
    const freshRec: RecurringExpense[] = JSON.parse(rawRec!);
    expect(freshRec.find((s) => s.id === 'rec-1')!.category).toBe('Groceries');
  });

  it('cascades category deletion by routing associated records to Other', async () => {
    // Setup categories
    const categories = await getCategories();
    const shopCat = categories.find((c) => c.name === 'Shopping')!;

    const mockExpenses: Expense[] = [
      { id: 'exp-1', amountCents: 500, category: 'Shopping', note: 'Clothes', date: '2026-07-18', createdAt: '' },
    ];
    await AsyncStorage.setItem('@expense_tracker/expenses', JSON.stringify(mockExpenses));

    // Delete 'Shopping'
    await deleteCategory(shopCat.id);

    const freshCats = await getCategories();
    expect(freshCats.find((c) => c.id === shopCat.id)).toBeUndefined();

    // Verify expense was re-routed to 'Other'
    const rawExp = await AsyncStorage.getItem('@expense_tracker/expenses');
    const freshExp: Expense[] = JSON.parse(rawExp!);
    expect(freshExp[0].category).toBe('Other');
  });

  it('prevents renaming or deleting system categories', async () => {
    const categories = await getCategories();
    const otherCat = categories.find((c) => c.name === 'Other')!;

    await expect(renameCategory(otherCat.id, 'Miscellaneous')).rejects.toThrow();
    await expect(deleteCategory(otherCat.id)).rejects.toThrow();
  });
});
