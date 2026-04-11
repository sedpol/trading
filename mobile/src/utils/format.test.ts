import { buildPositionsWithPnl } from './format';
import type { Summary } from '../types';

describe('buildPositionsWithPnl', () => {
  it('derives live-price P&L data from market summary data', () => {
    const summary: Summary = {
      allMarkets: [
        {
          change: 1.2,
          companyName: 'Apple Inc.',
          price: 212.48,
          startPrice: 210.01,
          symbol: 'AAPL',
        },
      ],
      balance: 25000,
      cashBalance: 12000,
      dailyPnl: 320,
      history: [],
      positions: [
        {
          averagePrice: 200,
          lots: [
            {
              boughtPrice: 200,
              quantity: 3,
            },
          ],
          quantity: 3,
          symbol: 'AAPL',
        },
      ],
      watchlist: [],
    };

    expect(buildPositionsWithPnl(summary)).toEqual([
      {
        averagePrice: 200,
        companyName: 'Apple Inc.',
        lots: [
          {
            boughtPrice: 200,
            quantity: 3,
          },
        ],
        marketPrice: 212.48,
        pnlPerShare: 12.47999999999999,
        quantity: 3,
        symbol: 'AAPL',
        totalPnl: 37.43999999999997,
      },
    ]);
  });
});