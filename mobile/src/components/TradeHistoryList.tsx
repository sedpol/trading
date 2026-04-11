import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts } from '../styles/theme';
import { formatCurrency, formatTradeTime } from '../utils/format';
import type { TradeHistoryItem } from '../types';

type TradeHistoryListProps = {
  history: TradeHistoryItem[];
  isLoading: boolean;
};

export function TradeHistoryList({ history, isLoading }: TradeHistoryListProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Trade History</Text>
      {isLoading ? <Text style={styles.empty}>Loading history...</Text> : null}
      {!isLoading && history.length === 0 ? <Text style={styles.empty}>No trades yet.</Text> : null}
      {!isLoading && history.map((trade) => (
        <View key={trade.id} style={styles.row}>
          <View style={styles.rowTop}>
            <Text style={styles.symbol}>{trade.symbol}</Text>
            <Text style={[styles.side, trade.side === 'BUY' ? styles.buy : styles.sell]}>{trade.side}</Text>
          </View>
          <Text style={styles.time}>{formatTradeTime(trade.timestamp)}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.metaText}>{trade.quantity} shares</Text>
            <Text style={styles.metaText}>{formatCurrency(trade.price)}</Text>
            <Text style={styles.metaText}>{formatCurrency(trade.netTotal)}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  buy: {
    color: colors.success,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
  },
  empty: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  metaText: {
    color: colors.text,
    fontFamily: fonts.body,
    fontSize: 13,
  },
  row: {
    borderTopColor: colors.border,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
  },
  rowTop: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sell: {
    color: colors.danger,
  },
  side: {
    fontFamily: fonts.body,
    fontSize: 13,
    fontWeight: '700',
  },
  symbol: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 18,
  },
  time: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginBottom: 8,
  },
  title: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 24,
    marginBottom: 10,
  },
});