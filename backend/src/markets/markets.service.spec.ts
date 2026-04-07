import { describe, expect, it, beforeEach } from 'vitest';
import { MarketsService } from './markets.service';

describe('MarketsService', () => {
  let service: MarketsService;
  const userId = 'user-demo-1';
  const otherUserId = 'user-demo-2';

  beforeEach(() => {
    service = new MarketsService();
  });

  it('returns a market summary with a watchlist and balances', () => {
    const summary = service.getSummary();

    expect(summary.watchlist).toHaveLength(5);
    expect(summary.allMarkets).toHaveLength(20);
    expect(summary.cashBalance).toBe(20000);
    expect(summary.balance).toBeGreaterThanOrEqual(summary.cashBalance);
    expect(summary.history).toEqual([]);
  });

  it('toggles a symbol into the backend watchlist selection', () => {
    const summary = service.toggleWatchlist(userId, 'NFLX');

    expect(summary.watchlist.map((item) => item.symbol)).toContain('NFLX');
  });

  it('processes a buy order and records the trade', () => {
    const before = service.getSummary(userId);
    const after = service.buyShares(userId, 'AAPL', 1);

    expect(after.cashBalance).toBeLessThan(before.cashBalance);
    expect(after.positions).toHaveLength(1);
    expect(after.positions[0].symbol).toBe('AAPL');
    expect(after.history[0].side).toBe('BUY');
    expect(after.watchlist.map((item) => item.symbol)).toContain('AAPL');
  });

  it('processes a sell order after a buy and updates positions', () => {
    service.buyShares(userId, 'AAPL', 2);
    const afterSell = service.sellShares(userId, 'AAPL', 1);

    expect(afterSell.positions[0].quantity).toBe(1);
    expect(afterSell.history[0].side).toBe('SELL');
  });

  it('updates watchlist prices with valid numeric values', () => {
    const updated = service.updateWatchlistPrices();

    expect(updated.allMarkets).toHaveLength(20);
    expect(updated.allMarkets.every((item) => typeof item.price === 'number')).toBe(true);
    expect(updated.allMarkets.every((item) => typeof item.change === 'number')).toBe(true);
  });

  it('keeps each authenticated user portfolio state isolated', () => {
    service.buyShares(userId, 'AAPL', 1);
    const untouchedUser = service.getSummary(otherUserId);

    expect(untouchedUser.positions).toEqual([]);
    expect(untouchedUser.history).toEqual([]);
    expect(untouchedUser.cashBalance).toBe(20000);
  });
});
