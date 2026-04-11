import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from './ActionButton';
import { TradeComposer } from './TradeComposer';
import { colors, fonts } from '../styles/theme';
import { formatCurrency, formatPercent } from '../utils/format';
import type { WatchlistItem } from '../types';

type MarketCardProps = {
  busyAction: 'buy' | 'sell' | null;
  isHeld: boolean;
  isWatched: boolean;
  item: WatchlistItem;
  onQuantityChange: (quantity: number) => void;
  onToggleWatchlist: () => void;
  onTrade: (side: 'buy' | 'sell') => void;
  quantity: number;
};

export function MarketCard({
  busyAction,
  isHeld,
  isWatched,
  item,
  onQuantityChange,
  onToggleWatchlist,
  onTrade,
  quantity,
}: MarketCardProps) {
  const changeColor = item.change >= 0 ? colors.success : colors.danger;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.symbol}>{item.symbol}</Text>
          <Text style={styles.company}>{item.companyName}</Text>
        </View>
        <ActionButton
          disabled={isHeld}
          kind={isWatched ? 'primary' : 'secondary'}
          label={isHeld ? 'Held' : isWatched ? 'Watching' : 'Watch'}
          onPress={onToggleWatchlist}
          style={styles.watchButton}
        />
      </View>

      <View style={styles.metrics}>
        <View>
          <Text style={styles.metricLabel}>Price</Text>
          <Text style={styles.metricValue}>{formatCurrency(item.price)}</Text>
        </View>
        <View>
          <Text style={styles.metricLabel}>Move</Text>
          <Text style={[styles.metricValue, { color: changeColor }]}>{formatPercent(item.change)}</Text>
        </View>
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
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  headerText: {
    flex: 1,
  },
  metricLabel: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  metricValue: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 18,
  },
  metrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  symbol: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 24,
  },
  watchButton: {
    minWidth: 106,
  },
});