import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { HoldingsPnl } from './components/HoldingsPnl';
import { StatsGrid } from './components/StatsGrid';
import { TradeHistory } from './components/TradeHistory';
import { Watchlist } from './components/Watchlist';
import type { Position, Summary } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;
const gbp = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
});

export default function App() {
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
      const marketPrice =
        summary.watchlist.find((item) => item.symbol === position.symbol)?.price ??
        position.averagePrice;
      const pnlPerShare = marketPrice - position.averagePrice;
      const totalPnl = pnlPerShare * position.quantity;

      return {
        ...position,
        marketPrice,
        pnlPerShare,
        totalPnl,
      };
    }) ?? [];

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
        <p className="eyebrow">Trading Dashboard</p>
        <h1>Track your markets, positions, and performance.</h1>
        <p className="lead">
          This starter connects a React frontend to a NestJS backend so you can
          start building your trading app right away.
        </p>
        <p className="connection-status">{connectionLabel}</p>
      </section>

      {error && (
        <div className="error-banner">
          <p>Error: {error}</p>
        </div>
      )}

      {tradeStatus && (
        <div className="success-banner">
          <p>{tradeStatus}</p>
        </div>
      )}

      <StatsGrid isLoading={isLoading} summary={summary} />

      <section className="content-grid">
        <Watchlist
          watchlist={summary?.watchlist ?? []}
          tradeQuantity={tradeQuantity}
          activeTradeKey={activeTradeKey}
          isLoading={isLoading}
          onQuantityChange={(symbol, quantity) =>
            setTradeQuantity((current) => ({ ...current, [symbol]: quantity }))
          }
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
