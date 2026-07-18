// src/components/TrendChart.tsx
// Renders a list of category cards showing rolling 3-month spending trends.
// Colors are dynamically resolved via the categoryColors lookup prop.
// Each card displays:
// 1. The category name and latest month total.
// 2. A 3-month vertical spark-column viz scaled relative to the global max spending.
// 3. A localized text history breakdown of the last 3 months.
// 4. A colored trend badge (green decrease indicator, red increase indicator).
// Connects to: src/services/trendSummary.ts, src/utils/currency.ts
// Created: 2026-07-17

import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { CategoryTrend } from '../services/trendSummary';
import { formatCents } from '../utils/currency';

interface TrendChartProps {
  trends: CategoryTrend[];
  latestMonthLabel: string;
  categoryColors: Record<string, string>;
}

const BAR_MAX_HEIGHT = 35;
const MIN_BAR_HEIGHT = 2;

export default function TrendChart({ trends, latestMonthLabel, categoryColors }: TrendChartProps) {
  if (trends.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyStateText}>No expense history found for this period.</Text>
      </View>
    );
  }

  // Find the global max amount across all categories/months to scale the sparklines consistently
  const globalMax = Math.max(
    1,
    ...trends.flatMap((trend) => trend.months.map((m) => m.amountCents))
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>3-Month Spending Trends</Text>
      <Text style={styles.subtitle}>Ending in {latestMonthLabel}</Text>

      {trends.map((item) => {
        const categoryColor = categoryColors[item.category] || '#999';
        const change = item.percentageChange;

        // Render trend badge details
        let badgeStyle = styles.badgeNeutral;
        let badgeTextStyle = styles.badgeTextNeutral;
        let badgeText = '0%';

        if (change === null) {
          badgeStyle = styles.badgeNew;
          badgeTextStyle = styles.badgeTextNew;
          badgeText = 'New';
        } else if (change > 0) {
          badgeStyle = styles.badgeWarning;
          badgeTextStyle = styles.badgeTextWarning;
          badgeText = `↑ ${change}%`;
        } else if (change < 0) {
          badgeStyle = styles.badgeSuccess;
          badgeTextStyle = styles.badgeTextSuccess;
          badgeText = `↓ ${Math.abs(change)}%`;
        }

        return (
          <View key={item.category} style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.categoryName}>{item.category}</Text>
                <Text style={styles.latestAmountText}>
                  Latest: <Text style={styles.latestAmount}>{formatCents(item.latestAmountCents)}</Text>
                </Text>
              </View>
              <View style={[styles.badge, badgeStyle]}>
                <Text style={[styles.badgeText, badgeTextStyle]}>{badgeText}</Text>
              </View>
            </View>

            <View style={styles.cardContent}>
              {/* History Text Breakdown */}
              <View style={styles.historySection}>
                {item.months.map((m, idx) => (
                  <View key={m.monthKey} style={styles.historyRow}>
                    <Text style={styles.historyLabel}>{m.label}:</Text>
                    <Text style={styles.historyValue}>{formatCents(m.amountCents)}</Text>
                  </View>
                ))}
              </View>

              {/* Mini Spark-Column Visualization */}
              <View style={styles.sparkContainer}>
                {item.months.map((m, idx) => {
                  const barHeight = Math.max(MIN_BAR_HEIGHT, (m.amountCents / globalMax) * BAR_MAX_HEIGHT);
                  // Opacity: Month 1 = 0.35, Month 2 = 0.65, Month 3 = 1.0
                  const barOpacity = idx === 0 ? 0.35 : idx === 1 ? 0.65 : 1.0;

                  return (
                    <View key={m.monthKey} style={styles.sparkCol}>
                      <View
                        style={[
                          styles.sparkBar,
                          {
                            height: barHeight,
                            backgroundColor: categoryColor,
                            opacity: barOpacity,
                          },
                        ]}
                      />
                      <Text style={styles.sparkLabel}>{m.label.slice(0, 1)}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 2,
  },
  emptyState: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    // Premium drop shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: '#f7f7f7',
    paddingBottom: 10,
    marginBottom: 10,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  latestAmountText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  latestAmount: {
    fontWeight: '600',
    color: '#333',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  badgeNeutral: {
    backgroundColor: '#f5f5f5',
  },
  badgeTextNeutral: {
    color: '#888',
  },
  badgeNew: {
    backgroundColor: '#ebf3ff',
  },
  badgeTextNew: {
    color: '#2f6feb',
  },
  badgeWarning: {
    backgroundColor: '#fdf2f2',
  },
  badgeTextWarning: {
    color: '#e34948',
  },
  badgeSuccess: {
    backgroundColor: '#f0fdf4',
  },
  badgeTextSuccess: {
    color: '#1baf7a',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  historySection: {
    flex: 1,
    gap: 4,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  historyLabel: {
    fontSize: 12,
    color: '#888',
    width: 35,
  },
  historyValue: {
    fontSize: 12,
    color: '#444',
    fontWeight: '500',
  },
  sparkContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingLeft: 16,
  },
  sparkCol: {
    alignItems: 'center',
    width: 22,
  },
  sparkBar: {
    width: 12,
    borderRadius: 3,
  },
  sparkLabel: {
    fontSize: 9,
    color: '#bbb',
    marginTop: 4,
    fontWeight: '600',
  },
});
