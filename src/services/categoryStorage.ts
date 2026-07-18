// src/services/categoryStorage.ts
// Manages AsyncStorage I/O for dynamic expense categories, seeding the initial
// set of 8 defaults on first load. Handles cascading renames and deletions
// across transaction records, recurring schedules, and budget goals.
// Connects to: src/models/expense.ts, src/models/recurring.ts, src/utils/logger.ts, src/utils/id.ts
// Created: 2026-07-18

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Expense } from '../models/expense';
import { RecurringExpense } from '../models/recurring';
import { generateId } from '../utils/id';
import { logger } from '../utils/logger';

export interface Category {
  id: string;
  name: string;
  color: string;
  isSystem?: boolean; // If true, cannot be renamed or deleted
}

const CATEGORIES_STORAGE_KEY = '@expense_tracker/categories';
const EXPENSES_STORAGE_KEY = '@expense_tracker/expenses';
const RECURRING_STORAGE_KEY = '@expense_tracker/recurring_schedules';
const BUDGETS_STORAGE_KEY = '@expense_tracker/budget_goals';
const SCOPE = 'categoryStorage';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-food', name: 'Food', color: '#2a78d6' },
  { id: 'cat-trans', name: 'Transportation', color: '#1baf7a' },
  { id: 'cat-housing', name: 'Housing', color: '#eda100' },
  { id: 'cat-util', name: 'Utilities', color: '#008300' },
  { id: 'cat-ent', name: 'Entertainment', color: '#4a3aa7' },
  { id: 'cat-health', name: 'Health', color: '#e34948' },
  { id: 'cat-shop', name: 'Shopping', color: '#e87ba4' },
  { id: 'cat-other', name: 'Other', color: '#eb6834', isSystem: true },
];

/** Reads all categories, seeding defaults if empty. */
export async function getCategories(): Promise<Category[]> {
  try {
    const raw = await AsyncStorage.getItem(CATEGORIES_STORAGE_KEY);
    if (!raw) {
      // Seed default categories
      await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Category[]) : DEFAULT_CATEGORIES;
  } catch (error) {
    logger.error(SCOPE, 'Failed to read categories from storage', { error: String(error) });
    return DEFAULT_CATEGORIES;
  }
}

/** Saves all categories to storage. */
async function writeAllCategories(categories: Category[]): Promise<void> {
  try {
    await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
  } catch (error) {
    logger.error(SCOPE, 'Failed to save categories', { error: String(error) });
    throw new Error('Could not save categories. Please try again.');
  }
}

/** Validates and adds a new category. */
export async function addCategory(name: string, color: string): Promise<Category> {
  const cleanName = name.trim();
  if (!cleanName) {
    throw new Error('Category name cannot be empty.');
  }
  if (cleanName.length > 20) {
    throw new Error('Category name must be 20 characters or less.');
  }

  const categories = await getCategories();
  const lowerName = cleanName.toLowerCase();
  const exists = categories.some((c) => c.name.toLowerCase() === lowerName);
  if (exists) {
    throw new Error(`Category "${cleanName}" already exists.`);
  }

  const newCategory: Category = {
    id: `cat-${generateId()}`,
    name: cleanName,
    color,
  };

  categories.push(newCategory);
  await writeAllCategories(categories);
  logger.info(SCOPE, 'Category added', { id: newCategory.id, name: newCategory.name });
  return newCategory;
}

/**
 * Renames a category, performing a cascading update across existing expenses,
 * recurring schedules, and budget goals.
 */
export async function renameCategory(id: string, newName: string): Promise<void> {
  const cleanName = newName.trim();
  if (!cleanName) {
    throw new Error('Category name cannot be empty.');
  }
  if (cleanName.length > 20) {
    throw new Error('Category name must be 20 characters or less.');
  }

  const categories = await getCategories();
  const targetIndex = categories.findIndex((c) => c.id === id);
  if (targetIndex === -1) {
    throw new Error('Category not found.');
  }

  const targetCategory = categories[targetIndex];
  if (targetCategory.isSystem) {
    throw new Error('System categories cannot be renamed.');
  }

  const lowerName = cleanName.toLowerCase();
  const exists = categories.some((c) => c.id !== id && c.name.toLowerCase() === lowerName);
  if (exists) {
    throw new Error(`Category "${cleanName}" already exists.`);
  }

  const oldName = targetCategory.name;
  targetCategory.name = cleanName;

  // 1. Read existing expenses, schedules & budgets
  const rawExpenses = await AsyncStorage.getItem(EXPENSES_STORAGE_KEY);
  const expenses: Expense[] = rawExpenses ? JSON.parse(rawExpenses) : [];

  const rawSchedules = await AsyncStorage.getItem(RECURRING_STORAGE_KEY);
  const schedules: RecurringExpense[] = rawSchedules ? JSON.parse(rawSchedules) : [];

  const rawBudgets = await AsyncStorage.getItem(BUDGETS_STORAGE_KEY);
  const budgets: Record<string, number> = rawBudgets ? JSON.parse(rawBudgets) : {};

  // 2. Cascade rename updates
  const updatedExpenses = expenses.map((e) => (e.category === oldName ? { ...e, category: cleanName } : e));
  const updatedSchedules = schedules.map((s) => (s.category === oldName ? { ...s, category: cleanName } : s));

  if (budgets[oldName] !== undefined) {
    budgets[cleanName] = budgets[oldName];
    delete budgets[oldName];
  }

  // 3. Batch save everything
  await AsyncStorage.multiSet([
    [CATEGORIES_STORAGE_KEY, JSON.stringify(categories)],
    [EXPENSES_STORAGE_KEY, JSON.stringify(updatedExpenses)],
    [RECURRING_STORAGE_KEY, JSON.stringify(updatedSchedules)],
    [BUDGETS_STORAGE_KEY, JSON.stringify(budgets)],
  ]);

  logger.info(SCOPE, 'Category renamed (cascading)', { id, oldName, newName: cleanName });
}

/**
 * Deletes a category, re-categorizing all associated expenses and schedules
 * to the default 'Other' category, and clearing any associated budget goals.
 */
export async function deleteCategory(id: string): Promise<void> {
  const categories = await getCategories();
  const target = categories.find((c) => c.id === id);
  if (!target) {
    throw new Error('Category not found.');
  }
  if (target.isSystem) {
    throw new Error('System categories cannot be deleted.');
  }

  const oldName = target.name;
  const filteredCategories = categories.filter((c) => c.id !== id);

  // 1. Read existing expenses, schedules & budgets
  const rawExpenses = await AsyncStorage.getItem(EXPENSES_STORAGE_KEY);
  const expenses: Expense[] = rawExpenses ? JSON.parse(rawExpenses) : [];

  const rawSchedules = await AsyncStorage.getItem(RECURRING_STORAGE_KEY);
  const schedules: RecurringExpense[] = rawSchedules ? JSON.parse(rawSchedules) : [];

  const rawBudgets = await AsyncStorage.getItem(BUDGETS_STORAGE_KEY);
  const budgets: Record<string, number> = rawBudgets ? JSON.parse(rawBudgets) : {};

  // 2. Cascade delete (re-route to 'Other')
  const updatedExpenses = expenses.map((e) => (e.category === oldName ? { ...e, category: 'Other' } : e));
  const updatedSchedules = schedules.map((s) => (s.category === oldName ? { ...s, category: 'Other' } : s));

  if (budgets[oldName] !== undefined) {
    delete budgets[oldName];
  }

  // 3. Batch save everything
  await AsyncStorage.multiSet([
    [CATEGORIES_STORAGE_KEY, JSON.stringify(filteredCategories)],
    [EXPENSES_STORAGE_KEY, JSON.stringify(updatedExpenses)],
    [RECURRING_STORAGE_KEY, JSON.stringify(updatedSchedules)],
    [BUDGETS_STORAGE_KEY, JSON.stringify(budgets)],
  ]);

  logger.info(SCOPE, 'Category deleted (cascading to Other)', { id, name: oldName });
}
