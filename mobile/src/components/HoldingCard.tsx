import { StyleSheet, Text, View } from 'react-native';
import { TradeComposer } from './TradeComposer';
import { colors, fonts } from '../styles/theme';
import { formatCurrency } from '../utils/format';
import type { PositionWithPnl } from '../types';

type HoldingCardProps = {
  busyAction: 'buy' | 'sell' | null;
  item: PositionWithPnl;
  onQuantityChange: (quantity: number) => void;
  onTrade: (side: 'buy' | 'sell') => void;
  quantity: number;
};

export function HoldingCard({ busyAction, item, onQuantityChange, onTrade, quantity }: HoldingCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.symbol}>{item.symbol}</Text>
          <Text style={styles.company}>{item.companyName || `${item.symbol} holding`}</Text>
        </View>
        <Text style={styles.quantity}>{item.quantity} shares</Text>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCell}>
          <Text style={styles.label}>Average Price</Text>
          <Text style={styles.value}>{formatCurrency(item.averagePrice)}</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.label}>Live Price</Text>
          <Text style={styles.value}>{formatCurrency(item.marketPrice)}</Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.label}>P&L / Share</Text>
          <Text style={[styles.value, item.pnlPerShare >= 0 ? styles.positive : styles.negative]}>
            {formatCurrency(item.pnlPerShare)}
          </Text>
        </View>
        <View style={styles.metricCell}>
          <Text style={styles.label}>Total P&L</Text>
          <Text style={[styles.value, item.totalPnl >= 0 ? styles.positive : styles.negative]}>
            {formatCurrency(item.totalPnl)}
          </Text>
        </View>
      </View>

      <View style={styles.lotsPanel}>
        <Text style={styles.lotsTitle}>Buy Lots</Text>
        {item.lots.map((lot, index) => (
          <View key={`${item.symbol}-${index}`} style={styles.lotRow}>
            <Text style={styles.lotText}>Lot #{index + 1}</Text>
            <Text style={styles.lotText}>{lot.quantity} shares</Text>
            <Text style={styles.lotText}>{formatCurrency(lot.boughtPrice)}</Text>
          </View>
        ))}
      </View>

      <TradeComposer
        busyAction={busyAction}
        onQuantityChange={onQuantityChange}
        onTrade={onTrade}
        quantity={quantity}
        symbol={item.symbol}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 14,
    padding: 18,
  },
  company: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    marginTop: 2,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  label: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  lotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  lotText: {
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  lotsPanel: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: 18,
    marginBottom: 16,
    padding: 14,
  },
  lotsTitle: {
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  metricCell: {
    width: '48%',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  negative: {
    color: colors.danger,
  },
  positive: {
    color: colors.success,
  },
  quantity: {
    color: colors.accent,
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '700',
  },
  symbol: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 24,
  },
  value: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 17,
  },
});