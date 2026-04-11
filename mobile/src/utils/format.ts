import type { PositionWithPnl, Summary } from '../types';

const gbpFormatter = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
});

const percentFormatter = new Intl.NumberFormat('en-GB', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export const formatCurrency = (value: number) => gbpFormatter.format(value);

export const formatPercent = (value: number) => `${value >= 0 ? '+' : ''}${percentFormatter.format(value)}%`;

export const formatTradeTime = (value: string) => dateFormatter.format(new Date(value));

export const buildPositionsWithPnl = (summary: Summary | null): PositionWithPnl[] => {
  if (!summary) {
    return [];
  }

  return summary.positions.map((position) => {
    const market = summary.watchlist.find((item) => item.symbol === position.symbol)
      ?? summary.allMarkets.find((item) => item.symbol === position.symbol);
    const marketPrice = market?.price ?? position.averagePrice;
    const companyName = position.companyName?.trim() ? position.companyName : market?.companyName;
    const pnlPerShare = marketPrice - position.averagePrice;
    const totalPnl = pnlPerShare * position.quantity;

    return {
      ...position,
      companyName,
      marketPrice,
      pnlPerShare,
      totalPnl,
    };
  });
};