// src/services/forecaster.ts
// Service for future cash flow forecasting. Computes the projected balance
// for any future target date by summing existing ledger transactions and
// simulating due occurrences of recurring schedules.
// Connects to: src/models/expense.ts, src/models/recurring.ts,
// src/services/recurringGenerator.ts, src/utils/date.ts
// Created: 2026-07-18

import { Expense, TransactionType } from '../models/expense';
import { RecurringExpense } from '../models/recurring';
import { getRecurringInstanceDates } from './recurringGenerator';
import { todayIsoDate } from '../utils/date';

export interface ForecastItem {
  id: string;
  amountCents: number;
  category: string;
  note: string;
  date: string;
  type: TransactionType;
  isSimulated: boolean;
}

export interface ForecastResult {
  targetDate: string;
  currentBalanceCents: number;
  projectedBalanceCents: number;
  items: ForecastItem[];
}

/**
 * Projects the cash balance and details all transactions (manual + recurring)
 * up to a target future date.
 */
export function forecastBalance(
  expenses: Expense[],
  recurringSchedules: RecurringExpense[],
  targetDate: string,
  todayStr: string = todayIsoDate(),
  startingBalanceCents: number = 0,
  startingDate: string = ''
): ForecastResult {
  // 1. Calculate current balance (sum of logged transactions up to todayStr, starting from startingBalanceCents)
  let currentBalanceCents = startingBalanceCents;
  expenses.forEach((item) => {
    const itemType = item.type ?? 'expense';
    if (item.date <= todayStr && (startingDate === '' || item.date >= startingDate)) {
      if (itemType === 'income') {
        currentBalanceCents += item.amountCents;
      } else {
        currentBalanceCents -= item.amountCents;
      }
    }
  });

  let projectedBalanceCents = currentBalanceCents;
  const forecastItems: ForecastItem[] = [];

  // 2. Add manual future transactions (transactions logged after todayStr, <= targetDate, and >= startingDate)
  expenses.forEach((item) => {
    if (item.date > todayStr && item.date <= targetDate && (startingDate === '' || item.date >= startingDate)) {
      const itemType = item.type ?? 'expense';
      if (itemType === 'income') {
        projectedBalanceCents += item.amountCents;
      } else {
        projectedBalanceCents -= item.amountCents;
      }

      forecastItems.push({
        id: item.id,
        amountCents: item.amountCents,
        category: item.category,
        note: item.note,
        date: item.date,
        type: itemType,
        isSimulated: false,
      });
    }
  });

  // 3. Project recurring instances that fall in the future window (todayStr < date <= targetDate, and >= startingDate)
  recurringSchedules.forEach((schedule) => {
    const scheduleType = schedule.type ?? 'expense';
    const dates = getRecurringInstanceDates(
      schedule.startDate,
      schedule.lastGeneratedDate || schedule.startDate,
      targetDate,
      schedule.interval
    );

    dates.forEach((date, index) => {
      // Only project instances that are strictly in the future (after todayStr) and >= startingDate
      if (date > todayStr && date <= targetDate && (startingDate === '' || date >= startingDate)) {
        if (scheduleType === 'income') {
          projectedBalanceCents += schedule.amountCents;
        } else {
          projectedBalanceCents -= schedule.amountCents;
        }

        forecastItems.push({
          id: `sim-${schedule.id}-${index}-${date}`,
          amountCents: schedule.amountCents,
          category: schedule.category,
          note: schedule.note,
          date,
          type: scheduleType,
          isSimulated: true,
        });
      }
    });
  });

  // Sort forecast items chronologically by date
  forecastItems.sort((a, b) => a.date.localeCompare(b.date));

  return {
    targetDate,
    currentBalanceCents,
    projectedBalanceCents,
    items: forecastItems,
  };
}
