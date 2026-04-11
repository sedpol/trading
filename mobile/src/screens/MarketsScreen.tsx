import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Banner } from '../components/Banner';
import { MarketCard } from '../components/MarketCard';
import { ScreenShell } from '../components/ScreenShell';
import { useSummary } from '../context/SummaryContext';
import { colors, fonts } from '../styles/theme';
import { formatTradeTime } from '../utils/format';

export function MarketsScreen() {
  const { banner, isLoading, isRefreshing, lastUpdatedAt, summary, toggleSymbolWatchlist, trade } = useSummary();
  const [tradeQuantity, setTradeQuantity] = useState<Record<string, number>>({});
  const [activeTradeKey, setActiveTradeKey] = useState<string | null>(null);

  const heldSymbols = useMemo(() => new Set(
    summary?.positions.filter((position) => position.quantity > 0).map((position) => position.symbol) ?? [],
  ), [summary?.positions]);

  const watchlistSymbols = useMemo(() => new Set(summary?.watchlist.map((item) => item.symbol) ?? []), [summary?.watchlist]);

  return (
    <ScreenShell
      eyebrow="Market Discovery"
      subtitle="Review the current market set, keep your watchlist in sync with the backend, and jump into a trade without leaving the screen."
      title="Markets and watchlist"
      footer={(
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>
            {lastUpdatedAt ? `Last synced ${formatTradeTime(new Date(lastUpdatedAt).toISOString())}` : 'Waiting for first market refresh'}
          </Text>
          <Text style={styles.footerText}>{isRefreshing ? 'Refreshing...' : 'Auto-refresh every 5s'}</Text>
        </View>
      )}
    >
      {banner ? <Banner text={banner.text} tone={banner.tone} /> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Watchlist</Text>
        {!isLoading && (summary?.watchlist.length ?? 0) === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No watched symbols yet. Add markets below to build your list.</Text>
          </View>
        ) : null}
        {summary?.watchlist.map((item) => (
          <MarketCard
            key={`watch-${item.symbol}`}
            busyAction={activeTradeKey === item.symbol ? 'buy' : activeTradeKey === `${item.symbol}:sell` ? 'sell' : null}
            isHeld={heldSymbols.has(item.symbol)}
            isWatched
            item={item}
            onQuantityChange={(quantity) => setTradeQuantity((current) => ({ ...current, [item.symbol]: quantity }))}
            onToggleWatchlist={async () => {
              await toggleSymbolWatchlist(item.symbol, 'Markets');
            }}
            onTrade={async (side) => {
              setActiveTradeKey(side === 'buy' ? item.symbol : `${item.symbol}:sell`);
              await trade(item.symbol, side, tradeQuantity[item.symbol] ?? 1, 'Markets');
              setActiveTradeKey(null);
            }}
            quantity={tradeQuantity[item.symbol] ?? 1}
          />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Markets</Text>
        {(summary?.allMarkets ?? []).map((item) => (
          <MarketCard
            key={item.symbol}
            busyAction={activeTradeKey === item.symbol ? 'buy' : activeTradeKey === `${item.symbol}:sell` ? 'sell' : null}
            isHeld={heldSymbols.has(item.symbol)}
            isWatched={watchlistSymbols.has(item.symbol)}
            item={item}
            onQuantityChange={(quantity) => setTradeQuantity((current) => ({ ...current, [item.symbol]: quantity }))}
            onToggleWatchlist={async () => {
              await toggleSymbolWatchlist(item.symbol, 'Markets');
            }}
            onTrade={async (side) => {
              setActiveTradeKey(side === 'buy' ? item.symbol : `${item.symbol}:sell`);
              await trade(item.symbol, side, tradeQuantity[item.symbol] ?? 1, 'Markets');
              setActiveTradeKey(null);
            }}
            quantity={tradeQuantity[item.symbol] ?? 1}
          />
        ))}
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  emptyCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 14,
    padding: 18,
  },
  emptyText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  footerRow: {
    gap: 4,
  },
  footerText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    color: colors.text,
    fontFamily: fonts.display,
    fontSize: 24,
    marginBottom: 12,
  },
});