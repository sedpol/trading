import { useState } from 'react';
import { WatchlistItem } from '../types';
import { BuySell } from './BuySell';

type WatchlistProps = {
  watchlist: WatchlistItem[];
  heldSymbols: Set<string>;
  tradeQuantity: Record<string, number>;
  activeTradeKey: string | null;
  isLoading: boolean;
  onQuantityChange: (symbol: string, quantity: number) => void;
  onToggleWatchlist: (symbol: string) => void;
  onTrade: (symbol: string, side: 'buy' | 'sell') => void;
};

const gbp = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
});

type SortKey = 'symbol' | 'price' | 'change';

type SortDirection = 'asc' | 'desc';

export function Watchlist({
  watchlist,
  heldSymbols,
  tradeQuantity,
  activeTradeKey,
  isLoading,
  onQuantityChange,
  onToggleWatchlist,
  onTrade,
}: WatchlistProps) {
  const [expandedSymbol, setExpandedSymbol] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const toggleExpanded = (symbol: string) => {
    setExpandedSymbol((current) => (current === symbol ? null : symbol));
  };

  const sortedWatchlist = [...watchlist].sort((left, right) => {
    const direction = sortDirection === 'asc' ? 1 : -1;

    if (sortKey === 'symbol') {
      return left.symbol.localeCompare(right.symbol) * direction;
    }

    const leftValue = sortKey === 'price' ? left.price : left.change;
    const rightValue = sortKey === 'price' ? right.price : right.change;

    return (leftValue - rightValue) * direction;
  });

  const updateSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection('asc');
  };

  return (
    <article className="panel">
      <h2>Watchlist</h2>
      <div className="table">
        {isLoading && <p>Loading market data...</p>}
        {!isLoading && (
          <div className="watchlist-scroll">
            <div className="watchlist-header-row">
              <span className="watchlist-heart-spacer" aria-hidden="true" />
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
                className={`sort-header-button${sortKey === 'price' ? ' sort-header-active' : ''}`}
                onClick={() => updateSort('price')}
                aria-sort={sortKey === 'price' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Price {sortKey === 'price' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </button>
              <button
                type="button"
                className={`sort-header-button${sortKey === 'change' ? ' sort-header-active' : ''}`}
                onClick={() => updateSort('change')}
                aria-sort={sortKey === 'change' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Change {sortKey === 'change' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
              </button>
              <span className="header-spacer" aria-hidden="true">&nbsp;</span>
            </div>
            {sortedWatchlist.map((item) => {
              const isExpanded = expandedSymbol === item.symbol;
              const isAutoFavourite = heldSymbols.has(item.symbol);
              return (
                <div className="watchlist-row" key={item.symbol}>
                  <div className="watchlist-row-header-wrap">
                    <button
                      type="button"
                      className="landing-favourite-button landing-favourite-active watchlist-row-heart"
                      onClick={() => onToggleWatchlist(item.symbol)}
                      disabled={isAutoFavourite}
                      aria-label={`Remove from watchlist ${item.symbol}`}
                      title={isAutoFavourite ? 'Bought shares cannot be removed from watchlist.' : undefined}
                    >
                      ♥
                    </button>
                    <button
                      type="button"
                      className="watchlist-row-header"
                      onClick={() => toggleExpanded(item.symbol)}
                      aria-expanded={isExpanded}
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${item.symbol}`}
                    >
                      <div className="watchlist-main">
                        <span>{item.symbol}</span>
                        <span>{gbp.format(item.price)}</span>
                        <span className={item.change >= 0 ? 'positive' : 'negative'}>
                          {item.change >= 0 ? '+' : ''}
                          {item.change.toFixed(2)}%
                        </span>
                      </div>
                      <span className="watchlist-chevron">
                        {isExpanded ? '▾' : '▸'}
                      </span>
                    </button>
                  </div>

                  {isExpanded && (
                    <>
                      <div className="watchlist-fullname">
                        {item.companyName ?? `${item.symbol} stock`}
                      </div>
                      <BuySell
                        symbol={item.symbol}
                        quantity={tradeQuantity[item.symbol] ?? 1}
                        activeTradeKey={activeTradeKey}
                        onQuantityChange={(quantity) => onQuantityChange(item.symbol, quantity)}
                        onTrade={(side) => onTrade(item.symbol, side)}
                      />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </article>
  );
}
