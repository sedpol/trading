import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../styles/theme';
import { formatCurrency } from '../utils/format';
import type { Summary } from '../types';

type MetricsStripProps = {
  isLoading: boolean;
  summary: Summary | null;
};

const metrics = [
  { key: 'balance', label: 'Portfolio Value' },
  { key: 'cashBalance', label: 'Cash Balance' },
  { key: 'dailyPnl', label: 'Daily P&L' },
] as const;

export function MetricsStrip({ isLoading, summary }: MetricsStripProps) {
  return (
    <View style={styles.row}>
      {metrics.map((metric) => {
        const rawValue = summary?.[metric.key];
        const isPnl = metric.key === 'dailyPnl';
        const value = isLoading || rawValue === undefined ? 'Loading...' : formatCurrency(rawValue);
        const tone = isPnl && typeof rawValue === 'number'
          ? rawValue >= 0
            ? colors.success
            : colors.danger
          : colors.text;

        return (
          <View key={metric.key} style={styles.card}>
            <Text style={styles.label}>{metric.label}</Text>
            <Text style={[styles.value, { color: tone }]}>{value}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    minHeight: 108,
    padding: 16,
  },
  label: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  value: {
    fontFamily: fonts.display,
    fontSize: 20,
    lineHeight: 26,
  },
});