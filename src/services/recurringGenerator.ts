// src/services/recurringGenerator.ts
// Calculates instance dates for recurring schedules and generates transaction records.
// Connects to: src/models/recurring.ts, src/models/expense.ts, src/utils/date.ts, src/utils/id.ts
// Created: 2026-07-18

import { RecurringExpense, RecurringInterval } from '../models/recurring';
import { Expense } from '../models/expense';
import { parseIsoDate, toIsoDate } from '../utils/date';
import { generateId } from '../utils/id';

function parseDateParts(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return { year: y, month: m, day: d };
}

function addDays(d: Date, days: number): Date {
  const res = new Date(d.getTime());
  res.setDate(res.getDate() + days);
  return res;
}

/**
 * Returns a sorted list of calendar date strings (YYYY-MM-DD) that should be generated.
 * Filters out dates on or before lastGeneratedDate (if provided) and after endDate (today).
 */
export function getRecurringInstanceDates(
  startDate: string,
  lastGeneratedDate: string | null,
  endDate: string,
  interval: RecurringInterval
): string[] {
  const dates: string[] = [];
  const minDateStr = lastGeneratedDate || '';

  if (interval === 'daily') {
    let current = lastGeneratedDate
      ? addDays(parseIsoDate(lastGeneratedDate), 1)
      : parseIsoDate(startDate);
    while (toIsoDate(current) <= endDate) {
      const currentStr = toIsoDate(current);
      if (currentStr > minDateStr) {
        dates.push(currentStr);
      }
      current = addDays(current, 1);
    }
  } else if (interval === 'weekly') {
    let k = 0;
    const start = parseIsoDate(startDate);
    while (true) {
      const candidate = addDays(start, k * 7);
      const candStr = toIsoDate(candidate);
      if (candStr > endDate) break;
      if (candStr > minDateStr) {
        dates.push(candStr);
      }
      k++;
    }
  } else if (interval === 'monthly') {
    let k = 0;
    const { year: y, month: m, day: d } = parseDateParts(startDate);
    while (true) {
      let newMonth = m + k;
      let newYear = y + Math.floor((newMonth - 1) / 12);
      newMonth = ((newMonth - 1) % 12) + 1;

      const lastDayInMonth = new Date(newYear, newMonth, 0).getDate();
      const newDay = Math.min(d, lastDayInMonth);
      const candidate = new Date(newYear, newMonth - 1, newDay);
      const candStr = toIsoDate(candidate);
      if (candStr > endDate) break;
      if (candStr > minDateStr) {
        dates.push(candStr);
      }
      k++;
    }
  } else if (interval === 'yearly') {
    let k = 0;
    const { year: y, month: m, day: d } = parseDateParts(startDate);
    while (true) {
      const newYear = y + k;
      const lastDayInMonth = new Date(newYear, m, 0).getDate();
      const newDay = Math.min(d, lastDayInMonth);
      const candidate = new Date(newYear, m - 1, newDay);
      const candStr = toIsoDate(candidate);
      if (candStr > endDate) break;
      if (candStr > minDateStr) {
        dates.push(candStr);
      }
      k++;
    }
  }

  return dates.sort();
}

/**
 * Sweeps the provided schedules against today's date, generating expense transaction
 * records and updating the schedules with the last generated date timestamp.
 */
export function generateExpensesFromSchedules(
  schedules: RecurringExpense[],
  todayStr: string
): { generatedExpenses: Expense[]; updatedSchedules: RecurringExpense[] } {
  const generatedExpenses: Expense[] = [];
  const updatedSchedules: RecurringExpense[] = [];

  schedules.forEach((schedule) => {
    const datesToGenerate = getRecurringInstanceDates(
      schedule.startDate,
      schedule.lastGeneratedDate,
      todayStr,
      schedule.interval
    );

    if (datesToGenerate.length > 0) {
      datesToGenerate.forEach((dateStr) => {
        generatedExpenses.push({
          id: generateId(),
          amountCents: schedule.amountCents,
          category: schedule.category,
          note: schedule.note,
          date: dateStr,
          createdAt: new Date().toISOString(),
        });
      });

      updatedSchedules.push({
        ...schedule,
        lastGeneratedDate: datesToGenerate[datesToGenerate.length - 1],
      });
    } else {
      updatedSchedules.push(schedule);
    }
  });

  return { generatedExpenses, updatedSchedules };
}
