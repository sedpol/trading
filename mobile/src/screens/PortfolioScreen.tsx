import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ActionButton } from '../components/ActionButton';
import { Banner } from '../components/Banner';
import { HoldingCard } from '../components/HoldingCard';
import { MetricsStrip } from '../components/MetricsStrip';
import { ScreenShell } from '../components/ScreenShell';
import { TradeHistoryList } from '../components/TradeHistoryList';
import { useAuth } from '../context/AuthContext';
import { useSummary } from '../context/SummaryContext';
import { colors, fonts } from '../styles/theme';
import { buildPositionsWithPnl, formatTradeTime } from '../utils/format';

export function PortfolioScreen() {
  const { banner, isLoading, isRefreshing, lastUpdatedAt, summary, trade } = useSummary();
  const { logout, user } = useAuth();
  const [tradeQuantity, setTradeQuantity] = useState<Record<string, number>>({});
  const [activeTradeKey, setActiveTradeKey] = useState<string | null>(null);

  const positions = useMemo(() => buildPositionsWithPnl(summary), [summary]);

  return (
    <ScreenShell
      eyebrow="My Portfolio"
      subtitle="Review holdings, inspect lot-level context, and manage positions with the same backend-owned balances and validations as web."
      title="Portfolio and history"
      footer={(
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>{user ? `Signed in as ${user.identifier}` : 'Signed in'}</Text>
          <Text style={styles.footerText}>
            {lastUpdatedAt ? `Last synced ${formatTradeTime(new Date(lastUpdatedAt).toISOString())}` : isRefreshing ? 'Refreshing...' : 'Waiting for data'}
          </Text>
          <ActionButton kind="secondary" label="Log out" onPress={() => void logout()} style={styles.logoutButton} />
        </View>
      )}
    >
      {banner ? <Banner text={banner.text} tone={banner.tone} /> : null}

      <MetricsStrip isLoading={isLoading} summary={summary} />

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Holdings P&L</Text>
        {!isLoading && positions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No shares held yet. Use the Markets tab to place your first trade.</Text>
          </View>
        ) : null}
        {positions.map((item) => (
          <HoldingCard
            key={item.symbol}
            busyAction={activeTradeKey === item.symbol ? 'buy' : activeTradeKey === `${item.symbol}:sell` ? 'sell' : null}
            item={item}
            onQuantityChange={(quantity) => setTradeQuantity((current) => ({ ...current, [item.symbol]: quantity }))}
            onTrade={async (side) => {
              setActiveTradeKey(side === 'buy' ? item.symbol : `${item.symbol}:sell`);
              await trade(item.symbol, side, tradeQuantity[item.symbol] ?? 1, 'Portfolio');
              setActiveTradeKey(null);
            }}
            quantity={tradeQuantity[item.symbol] ?? 1}
          />
        ))}
      </View>

      <View style={styles.section}>
        <TradeHistoryList history={summary?.history ?? []} isLoading={isLoading} />
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
    gap: 6,
  },
  footerText: {
    color: colors.textMuted,
    fontFamily: fonts.body,
    fontSize: 12,
  },
  logoutButton: {
    marginTop: 8,
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