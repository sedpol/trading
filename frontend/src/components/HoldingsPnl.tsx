import { useState } from 'react';
import { Position } from '../types';
import { BuySell } from './BuySell';

type HoldingWithPnl = Position & {
  marketPrice: number;
  pnlPerShare: number;
  totalPnl: number;
};

type SortKey =
  | 'symbol'
  | 'quantity'
  | 'averagePrice'
  | 'marketPrice'
  | 'pnlPerShare'
  | 'totalPnl';

type SortDirection = 'asc' | 'desc';

type HoldingsPnlProps = {
  isLoading: boolean;
  positionsWithPnl: HoldingWithPnl[];
  selectedHolding: string | null;
  toggleHolding: (symbol: string) => void;
  tradeQuantity: Record<string, number>;
  activeTradeKey: string | null;
  onQuantityChange: (symbol: string, quantity: number) => void;
  onTrade: (symbol: string, side: 'buy' | 'sell') => void;
};

const gbp = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
});

export function HoldingsPnl({
  isLoading,
  positionsWithPnl,
  selectedHolding,
  toggleHolding,
  tradeQuantity,
  activeTradeKey,
  onQuantityChange,
  onTrade,
}: HoldingsPnlProps) {
  const [sortKey, setSortKey] = useState<SortKey>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortedPositions = [...positionsWithPnl].sort((left, right) => {
    const direction = sortDirection === 'asc' ? 1 : -1;

    if (sortKey === 'symbol') {
      return left.symbol.localeCompare(right.symbol) * direction;
    }

    switch (sortKey) {
      case 'quantity':
        return (left.quantity - right.quantity) * direction;
      case 'averagePrice':
        return (left.averagePrice - right.averagePrice) * direction;
      case 'marketPrice':
        return (left.marketPrice - right.marketPrice) * direction;
      case 'pnlPerShare':
        return (left.pnlPerShare - right.pnlPerShare) * direction;
      case 'totalPnl':
        return (left.totalPnl - right.totalPnl) * direction;
      default:
        return 0;
    }
  });

  const updateSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection('asc');
  };

  const getHoldingLotsTitle = (item: HoldingWithPnl) => {
    const companyName = item.companyName?.trim();
    return companyName ? `${companyName} Buy Lots` : `${item.symbol} Buy Lots`;
  };

  return (
    <article className="panel">
      <h2>Holdings P&amp;L</h2>
      <div className="pnl-table">
        <div className="pnl-header">
          <button
            type="button"
            className={`sort-header-button${sortKey === 'symbol' ? ' sort-header-active' : ''}`}
            onClick={() => updateSort('symbol')}
            aria-sort={sortKey === 'symbol' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
          >
            Symbol {sortKey === 'symbol' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button
            type="button"
            className={`sort-header-button${sortKey === 'quantity' ? ' sort-header-active' : ''}`}
            onClick={() => updateSort('quantity')}
            aria-sort={sortKey === 'quantity' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
          >
            Shares {sortKey === 'quantity' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button
            type="button"
            className={`sort-header-button${sortKey === 'averagePrice' ? ' sort-header-active' : ''}`}
            onClick={() => updateSort('averagePrice')}
            aria-sort={sortKey === 'averagePrice' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
          >
            Avg Price {sortKey === 'averagePrice' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button
            type="button"
            className={`sort-header-button${sortKey === 'marketPrice' ? ' sort-header-active' : ''}`}
            onClick={() => updateSort('marketPrice')}
            aria-sort={sortKey === 'marketPrice' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
          >
            Live Price {sortKey === 'marketPrice' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button
            type="button"
            className={`sort-header-button${sortKey === 'pnlPerShare' ? ' sort-header-active' : ''}`}
            onClick={() => updateSort('pnlPerShare')}
            aria-sort={sortKey === 'pnlPerShare' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
          >
            P&amp;L / Share {sortKey === 'pnlPerShare' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
          </button>
          <button
            type="button"
            className={`sort-header-button${sortKey === 'totalPnl' ? ' sort-header-active' : ''}`}
            onClick={() => updateSort('totalPnl')}
            aria-sort={sortKey === 'totalPnl' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
          >
            Total P&amp;L {sortKey === 'totalPnl' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
          </button>
          <span className="header-spacer" aria-hidden="true">&nbsp;</span>
        </div>
        <div className="holdings-scroll">
          {isLoading && <p>Loading positions...</p>}
          {!isLoading && positionsWithPnl.length === 0 && <p>No shares held yet.</p>}
          {!isLoading &&
            sortedPositions.map((item) => (
              <div className="holding-group" key={item.symbol}>
                <button
                  className={`pnl-row pnl-row-button${
                    selectedHolding === item.symbol ? ' pnl-row-selected' : ''
                  }`}
                  onClick={() => toggleHolding(item.symbol)}
                  type="button"
                >
                  <span>{item.symbol}</span>
                  <span>{item.quantity}</span>
                  <span>{gbp.format(item.averagePrice)}</span>
                  <span>{gbp.format(item.marketPrice)}</span>
                  <span className={item.pnlPerShare >= 0 ? 'positive' : 'negative'}>
                    {gbp.format(item.pnlPerShare)}
                  </span>
                  <span className={item.totalPnl >= 0 ? 'positive' : 'negative'}>
                    {gbp.format(item.totalPnl)}
                  </span>
                  <span className="holding-chevron">
                    {selectedHolding === item.symbol ? '▾' : '▸'}
                  </span>
                </button>

                {selectedHolding === item.symbol && (
                  <div className="holding-lots">
                    <p className="holding-lots-title">{getHoldingLotsTitle(item)}</p>
                    <div className="holding-lots-header">
                      <span>Lot</span>
                      <span>Shares</span>
                      <span>Bought Price</span>
                    </div>
                    {item.lots.map((lot, index) => (
                      <div className="holding-lot-row" key={`${item.symbol}-${index}`}>
                        <span>#{index + 1}</span>
                        <span>{lot.quantity}</span>
                        <span>{gbp.format(lot.boughtPrice)}</span>
                      </div>
                    ))}
                    <div className="holding-lots-trade">
                      <BuySell
                        symbol={item.symbol}
                        quantity={tradeQuantity[item.symbol] ?? 1}
                        activeTradeKey={activeTradeKey}
                        onQuantityChange={(quantity) => onQuantityChange(item.symbol, quantity)}
                        onTrade={(side) => onTrade(item.symbol, side)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>
    </article>
  );
}
