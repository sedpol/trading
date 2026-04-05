import { describe, expect, it, beforeEach } from 'vitest';
import { MarketsService } from './markets.service';

describe('MarketsService', () => {
  let service: MarketsService;

  beforeEach(() => {
    service = new MarketsService();
  });

  it('returns a market summary with a watchlist and balances', () => {
    const summary = service.getSummary();

    expect(summary.watchlist).toHaveLength(20);
    expect(summary.cashBalance).toBe(20000);
    expect(summary.balance).toBeGreaterThanOrEqual(summary.cashBalance);
    expect(summary.history).toEqual([]);
  });

  it('processes a buy order and records the trade', () => {
    const before = service.getSummary();
    const after = service.buyShares('AAPL', 1);

    expect(after.cashBalance).toBeLessThan(before.cashBalance);
    expect(after.positions).toHaveLength(1);
    expect(after.positions[0].symbol).toBe('AAPL');
    expect(after.history[0].side).toBe('BUY');
  });

  it('processes a sell order after a buy and updates positions', () => {
    service.buyShares('AAPL', 2);
    const afterSell = service.sellShares('AAPL', 1);

    expect(afterSell.positions[0].quantity).toBe(1);
    expect(afterSell.history[0].side).toBe('SELL');
  });

  it('updates watchlist prices with valid numeric values', () => {
    const updated = service.updateWatchlistPrices();

    expect(updated.watchlist).toHaveLength(20);
    expect(updated.watchlist.every((item) => typeof item.price === 'number')).toBe(true);
    expect(updated.watchlist.every((item) => typeof item.change === 'number')).toBe(true);
  });
});
