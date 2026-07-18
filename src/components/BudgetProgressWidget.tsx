// src/components/BudgetProgressWidget.tsx
// Renders active monthly spending compared to category budget goals.
// Features progress tracks styled in specific category colors and overspend warning labels.
// Connects to: src/models/expense.ts, src/components/ThemeProvider.tsx
// Created: 2026-07-18

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Expense } from '../models/expense';
import { Category } from '../services/categoryStorage';
import { formatCents } from '../utils/currency';
import { useTheme } from './ThemeProvider';

interface BudgetProgressWidgetProps {
  expenses: Expense[];
  categories: Category[];
  budgetGoals: Record<string, number>;
  onManagePress: () => void;
}

export default function BudgetProgressWidget({
  expenses,
  categories,
  budgetGoals,
  onManagePress,
}: BudgetProgressWidgetProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors, isDark);

  // Get current year and month (YYYY-MM)
  const currentYyyyMm = new Date().toISOString().substring(0, 7);

  // Filter categories that have monthly budgets set (> 0)
  const activeBudgets = categories
    .map((cat) => {
      const limit = budgetGoals[cat.name] ?? 0;
      if (limit <= 0) return null;

      // Sum expenses for this category in the current month
      const spent = expenses
        .filter(
          (e) =>
            e.category === cat.name &&
            (e.type ?? 'expense') === 'expense' &&
            e.date.startsWith(currentYyyyMm)
        )
        .reduce((sum, e) => sum + e.amountCents, 0);

      return {
        categoryName: cat.name,
        color: cat.color,
        limit,
        spent,
        percent: limit > 0 ? (spent / limit) * 100 : 0,
        remaining: limit - spent,
      };
    })
    .filter((b): b is NonNullable<typeof b> => b !== null);

  if (activeBudgets.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Monthly Budget Progress</Text>
        <Text style={styles.emptyText}>
          Set monthly budget targets to monitor category spending automatically.
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={onManagePress}
          accessibilityRole="button"
          accessibilityLabel="Configure budget targets"
        >
          <Text style={styles.ctaButtonText}>＋ Configure Budgets</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.cardTitle}>Monthly Budget Progress</Text>
        <TouchableOpacity onPress={onManagePress} accessibilityRole="button">
          <Text style={styles.manageLink}>Edit Targets</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.budgetList}>
        {activeBudgets.map((b) => {
          const isOver = b.spent > b.limit;
          const displayPercent = Math.min(Math.round(b.percent), 100);

          return (
            <View key={b.categoryName} style={styles.budgetItem}>
              <View style={styles.budgetItemHeader}>
                <View style={styles.labelGroup}>
                  <View style={[styles.colorDot, { backgroundColor: b.color }]} />
                  <Text style={styles.categoryName} numberOfLines={1}>
                    {b.categoryName}
                  </Text>
                </View>
                <Text style={styles.amountsText}>
                  {formatCents(b.spent)} <Text style={styles.limitLabel}>of {formatCents(b.limit)}</Text>
                </Text>
              </View>

              {/* Progress bar container */}
              <View style={styles.trackContainer}>
                <View
                  style={[
                    styles.trackBar,
                    {
                      width: `${displayPercent}%`,
                      backgroundColor: isOver ? colors.error : b.color,
                    },
                  ]}
                />
              </View>

              {/* Overage and remaining detail metrics */}
              <View style={styles.itemFooter}>
                <Text style={styles.percentText}>{Math.round(b.percent)}% Used</Text>
                {isOver ? (
                  <Text style={styles.overspentText}>
                    ⚠️ Over budget by {formatCents(Math.abs(b.remaining))}
                  </Text>
                ) : (
                  <Text style={styles.remainingText}>
                    {formatCents(b.remaining)} remaining
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: any, isDark: boolean) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 16,
      marginTop: 16,
      marginBottom: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0.25 : 0.06,
      shadowRadius: 10,
      elevation: 3,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    manageLink: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.primary,
    },
    emptyText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 18,
      marginVertical: 12,
    },
    ctaButton: {
      backgroundColor: colors.surfaceSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingVertical: 10,
      alignItems: 'center',
    },
    ctaButtonText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.primary,
    },
    budgetList: {
      gap: 16,
    },
    budgetItem: {
      width: '100%',
    },
    budgetItemHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    labelGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      paddingRight: 8,
    },
    colorDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginRight: 8,
    },
    categoryName: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    amountsText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    limitLabel: {
      fontWeight: '400',
      color: colors.textSecondary,
    },
    trackContainer: {
      height: 8,
      backgroundColor: isDark ? '#262626' : '#f0f0f0',
      borderRadius: 4,
      overflow: 'hidden',
      width: '100%',
    },
    trackBar: {
      height: '100%',
      borderRadius: 4,
    },
    itemFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 6,
    },
    percentText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    remainingText: {
      fontSize: 11,
      color: colors.success,
      fontWeight: '600',
    },
    overspentText: {
      fontSize: 11,
      color: colors.error,
      fontWeight: '700',
    },
  });
