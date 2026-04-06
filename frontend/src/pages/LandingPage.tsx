import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { BuySell } from '../components/BuySell';
import { MessageBanner } from '../components/MessageBanner';
import type { Summary } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;

const getConnectionDotState = (label: string) =>
  label === 'Live prices connected' ? 'connected' : 'disconnected';

const getConnectionA11yLabel = (label: string) =>
  label === 'Live prices connected'
    ? 'Connection status: connected'
    : 'Connection status: disconnected';

type SortKey = 'symbol' | 'companyName' | 'price' | 'change';
type SortDirection = 'asc' | 'desc';

const gbp = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
});

export function LandingPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoadingMarkets, setIsLoadingMarkets] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionLabel, setConnectionLabel] = useState('Connecting...');
  const [tradeStatus, setTradeStatus] = useState<string | null>(null);
  const [tradeQuantity, setTradeQuantity] = useState<Record<string, number>>({});
  const [activeTradeKey, setActiveTradeKey] = useState<string | null>(null);
  const [expandedMarket, setExpandedMarket] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    if (!tradeStatus) {
      return;
    }

    const timer = window.setTimeout(() => {
      setTradeStatus(null);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [tradeStatus]);

  useEffect(() => {
    if (!error) {
      return;
    }

    const timer = window.setTimeout(() => {
      setError(null);
    }, 5000);

    return () => window.clearTimeout(timer);
  }, [error]);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setIsLoadingMarkets(true);
        const response = await fetch(`${API_BASE_URL}/markets/summary`);

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        const data: Summary = await response.json();
        setSummary(data);
        setError(null);
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unable to load markets.');
      } finally {
        setIsLoadingMarkets(false);
      }
    };

    fetchSummary();
  }, []);

  useEffect(() => {
    if (SOCKET_URL === 'none') {
      setConnectionLabel('Live prices disabled');
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      setConnectionLabel('Live prices connected');
      setError(null);
    });

    socket.on('market.update', (data: Summary) => {
      setSummary(data);
      setIsLoadingMarkets(false);
    });

    socket.on('connect_error', () => {
      setConnectionLabel('Live prices disconnected');
      setError('WebSocket connection failed');
    });

    socket.on('disconnect', () => {
      setConnectionLabel('Live prices disconnected');
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const heldSymbols = useMemo(() => {
    const symbols = summary?.positions
      .filter((position) => position.quantity > 0)
      .map((position) => position.symbol) ?? [];

    return new Set(symbols);
  }, [summary?.positions]);

  const watchlistSymbols = useMemo(
    () => new Set(summary?.watchlist.map((item) => item.symbol) ?? []),
    [summary?.watchlist],
  );

  const watchlistMarkets = useMemo(
    () => [...(summary?.watchlist ?? [])].sort((left, right) => left.symbol.localeCompare(right.symbol)),
    [summary?.watchlist],
  );

  const sortedMarkets = useMemo(() => {
    const markets = summary?.allMarkets ?? [];
    const direction = sortDirection === 'asc' ? 1 : -1;

    return [...markets].sort((left, right) => {
      if (sortKey === 'symbol' || sortKey === 'companyName') {
        return left[sortKey].localeCompare(right[sortKey]) * direction;
      }

      return (left[sortKey] - right[sortKey]) * direction;
    });
  }, [sortDirection, sortKey, summary?.watchlist]);

  const updateSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection('asc');
  };

  const toggleWatchlist = async (symbol: string) => {
    if (heldSymbols.has(symbol)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/markets/watchlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update watchlist: ${response.statusText}`);
      }

      const data: Summary = await response.json();
      setSummary(data);
      setError(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to update watchlist.');
    }
  };

  const handleTrade = async (symbol: string, side: 'buy' | 'sell') => {
    const quantity = tradeQuantity[symbol] ?? 1;

    try {
      setActiveTradeKey(`${side}-${symbol}`);
      setTradeStatus(null);

      const response = await fetch(`${API_BASE_URL}/markets/${side}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbol, quantity }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
        throw new Error(message ?? `Failed to ${side} shares.`);
      }

      setSummary(data as Summary);
      setError(null);
      setTradeStatus(`${side === 'buy' ? 'Bought' : 'Sold'} ${quantity} ${symbol} share(s).`);
      setTradeQuantity((current) => ({ ...current, [symbol]: 1 }));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unable to execute trade.');
    } finally {
      setActiveTradeKey(null);
    }
  };

  const toggleExpandedMarket = (symbol: string) => {
    setExpandedMarket((current) => (current === symbol ? null : symbol));
  };

  return (
    <main className="landing-shell">
      <section className="landing-hero">
        <p className="landing-kicker">Built for Active Traders</p>
        <h1>Trade confidently with live signals and portfolio intelligence.</h1>
        <p>
          Monitor real-time market movement, review your risk exposure, and execute
          quickly from a focused portfolio workflow.
        </p>
        <div className="landing-actions">
          <Link className="landing-primary-cta" to="/portfolio">
            Go to My Portfolio
          </Link>
          <a className="landing-secondary-cta" href="#markets">
            Explore Features
          </a>
        </div>
      </section>

      <section className="landing-grid" id="features">
        <article className="landing-card">
          <h2>Live Market Pulse</h2>
          <p>Track your watchlist with continuous updates and instant trade execution.</p>
        </article>
        <article className="landing-card">
          <h2>Holdings P&amp;L Clarity</h2>
          <p>Understand position performance, lot history, and per-symbol profitability.</p>
        </article>
        <article className="landing-card">
          <h2>Execution-First Workflow</h2>
          <p>Move from insight to action with minimal friction from one unified interface.</p>
        </article>
      </section>

      <section className="landing-disclaimer">
        <p>
          Risk warning: Trading involves risk of loss. Use this dashboard responsibly and
          assess your financial situation before placing trades.
        </p>
      </section>

      {tradeStatus && (
        <MessageBanner message={tradeStatus} variant="success" />
      )}

      {error && (
        <MessageBanner message={error} prefix="Error: " variant="error" />
      )}

      <section className="landing-markets" id="markets">
        <div className="landing-markets-header">
          <div className="landing-markets-heading-row">
            <h2>All Markets</h2>
            <div
              className="connection-status-indicator"
              role="status"
              aria-live="polite"
              aria-label={getConnectionA11yLabel(connectionLabel)}
            >
              <span
                aria-hidden="true"
                className={`connection-status-dot connection-status-dot-${getConnectionDotState(connectionLabel)}`}
              />
            </div>
          </div>
          <p>Bought shares are added to watchlist automatically.</p>
        </div>

        <div className="landing-watchlist">
          <h3>Watchlist</h3>
          <p>Showing {watchlistMarkets.length} symbols.</p>
          <div className="landing-watchlist-chips">
            {watchlistMarkets.map((item) => (
              <span key={item.symbol} className="landing-watchlist-chip">
                {item.symbol}
              </span>
            ))}
          </div>
        </div>

        {isLoadingMarkets && <p>Loading markets...</p>}

        {!isLoadingMarkets && summary && (
          <div className="landing-markets-table-scroll">
            <div className="landing-markets-table" role="table" aria-label="All markets">
            <div className="landing-market-row landing-market-header" role="row">
              <span></span>
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
                className={`sort-header-button${sortKey === 'companyName' ? ' sort-header-active' : ''}`}
                onClick={() => updateSort('companyName')}
                aria-sort={sortKey === 'companyName' ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
              >
                Company {sortKey === 'companyName' ? (sortDirection === 'asc' ? '↑' : '↓') : ''}
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
              <span aria-hidden="true" className="header-spacer">&nbsp;</span>
            </div>

            {sortedMarkets.map((item) => {
              const isAutoFavourite = heldSymbols.has(item.symbol);
              const isFavourite = watchlistSymbols.has(item.symbol);
              const isExpanded = expandedMarket === item.symbol;

              return (
                <div className="landing-market-group" key={item.symbol}>
                  <div className="landing-market-row" role="row">
                    <button
                      type="button"
                      className={`landing-favourite-button${isFavourite ? ' landing-favourite-active' : ''}`}
                      onClick={() => toggleWatchlist(item.symbol)}
                      disabled={isAutoFavourite}
                      aria-label={`${isFavourite ? 'Remove from watchlist' : 'Add to watchlist'} ${item.symbol}`}
                      title={isAutoFavourite ? 'Bought shares cannot be removed from watchlist.' : undefined}
                    >
                      {isAutoFavourite ? '♥' : isFavourite ? '♥' : '♡'}
                    </button>
                    <span>{item.symbol}</span>
                    <span>{item.companyName}</span>
                    <span>{gbp.format(item.price)}</span>
                    <span className={item.change >= 0 ? 'positive' : 'negative'}>
                      {item.change >= 0 ? '+' : ''}
                      {item.change.toFixed(2)}%
                    </span>
                    <button
                      type="button"
                      className="landing-chevron-button"
                      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${item.symbol}`}
                      aria-expanded={isExpanded}
                      onClick={() => toggleExpandedMarket(item.symbol)}
                    >
                      {isExpanded ? '▾' : '▸'}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="landing-market-expanded" role="row">
                      <span aria-hidden="true" className="landing-market-expanded-offset" />
                      <div className="landing-market-expanded-panel">
                        <BuySell
                          symbol={item.symbol}
                          quantity={tradeQuantity[item.symbol] ?? 1}
                          activeTradeKey={activeTradeKey}
                          onQuantityChange={(quantity) =>
                            setTradeQuantity((current) => ({ ...current, [item.symbol]: quantity }))
                          }
                          onTrade={(side) => handleTrade(item.symbol, side)}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
