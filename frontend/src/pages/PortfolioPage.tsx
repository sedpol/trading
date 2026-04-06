import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { HoldingsPnl } from '../components/HoldingsPnl';
import { MessageBanner } from '../components/MessageBanner';
import { StatsGrid } from '../components/StatsGrid';
import { TradeHistory } from '../components/TradeHistory';
import { Watchlist } from '../components/Watchlist';
import type { Position, Summary } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;

const getConnectionDotState = (label: string) =>
  label === 'Live prices connected' ? 'connected' : 'disconnected';

const getConnectionA11yLabel = (label: string) =>
  label === 'Live prices connected'
    ? 'Connection status: connected'
    : 'Connection status: disconnected';

export function PortfolioPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [connectionLabel, setConnectionLabel] = useState('Connecting...');
  const [tradeStatus, setTradeStatus] = useState<string | null>(null);
  const [tradeQuantity, setTradeQuantity] = useState<Record<string, number>>({});
  const [activeTradeKey, setActiveTradeKey] = useState<string | null>(null);
  const [selectedHolding, setSelectedHolding] = useState<string | null>(null);

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
        setIsLoading(true);
        const response = await fetch(`${API_BASE_URL}/markets/summary`);

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.statusText}`);
        }

        const data: Summary = await response.json();
        setSummary(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
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
      setIsLoading(false);
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

  type HoldingWithPnl = Position & {
    marketPrice: number;
    pnlPerShare: number;
    totalPnl: number;
  };

  const positionsWithPnl: HoldingWithPnl[] =
    summary?.positions.map((position) => {
      const market = summary.watchlist.find((item) => item.symbol === position.symbol);
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
    }) ?? [];

  const heldSymbols = useMemo(() => {
    const symbols = summary?.positions
      .filter((position) => position.quantity > 0)
      .map((position) => position.symbol) ?? [];

    return new Set(symbols);
  }, [summary?.positions]);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update watchlist.');
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trade failed.');
    } finally {
      setActiveTradeKey(null);
    }
  };

  const toggleHolding = (symbol: string) => {
    setSelectedHolding((current) => (current === symbol ? null : symbol));
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <div className="hero-top-header">
          <Link className="portfolio-home-link portfolio-back-link" to="/" aria-label="Back to Landing">
            <svg
              aria-hidden="true"
              className="portfolio-back-icon"
              viewBox="0 0 24 24"
              width="20"
              height="20"
            >
              <path
                d="M15.5 4.5L8 12l7.5 7.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
          <p className="eyebrow">My Portfolio</p>
        </div>
        <h1>Track your markets, positions, and performance.</h1>
        <p className="lead">
          Use live pricing, holdings P&amp;L, and trade history to manage your strategy.
        </p>
        <div className="hero-actions">
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
      </section>

      {error && (
        <MessageBanner message={error} prefix="Error: " variant="error" />
      )}

      {tradeStatus && (
        <MessageBanner message={tradeStatus} variant="success" />
      )}

      <StatsGrid isLoading={isLoading} summary={summary} />

      <section className="content-grid">
        <Watchlist
          watchlist={summary?.watchlist ?? []}
          heldSymbols={heldSymbols}
          tradeQuantity={tradeQuantity}
          activeTradeKey={activeTradeKey}
          isLoading={isLoading}
          onQuantityChange={(symbol, quantity) =>
            setTradeQuantity((current) => ({ ...current, [symbol]: quantity }))
          }
          onToggleWatchlist={toggleWatchlist}
          onTrade={handleTrade}
        />
        <div className="holdings-grid-item">
          <HoldingsPnl
            isLoading={isLoading}
            positionsWithPnl={positionsWithPnl}
            selectedHolding={selectedHolding}
            toggleHolding={toggleHolding}
            tradeQuantity={tradeQuantity}
            activeTradeKey={activeTradeKey}
            onQuantityChange={(symbol, quantity) =>
              setTradeQuantity((current) => ({ ...current, [symbol]: quantity }))
            }
            onTrade={handleTrade}
          />
        </div>
      </section>

      <section className="history-section">
        <TradeHistory isLoading={isLoading} history={summary?.history ?? []} />
      </section>
    </main>
  );
}
