import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';

type PositionLot = {
  quantity: number;
  boughtPrice: number;
};

type TradeHistoryItem = {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  grossTotal: number;
  commission: number;
  netTotal: number;
  timestamp: string;
};

type Summary = {
  balance: number;
  cashBalance: number;
  dailyPnl: number;
  watchlist: Array<{
    symbol: string;
    startPrice: number;
    price: number;
    change: number;
  }>;
  positions: Array<{
    symbol: string;
    quantity: number;
    averagePrice: number;
    lots: PositionLot[];
  }>;
  history: TradeHistoryItem[];
};

const API_BASE_URL = 'http://localhost:3000';
const SOCKET_URL = 'http://localhost:3000';
const gbp = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
});
const dateTime = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'medium',
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

  const positionsWithPnl =
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

      <section className="stats-grid">
        <article className="card">
          <span>Total Balance</span>
          <strong>
            {isLoading ? 'Loading...' : summary ? gbp.format(summary.balance) : '--'}
          </strong>
        </article>

        <article className="card">
          <span>Cash Balance</span>
          <strong>
            {isLoading ? 'Loading...' : summary ? gbp.format(summary.cashBalance) : '--'}
          </strong>
        </article>

        <article className="card">
          <span>Total P&amp;L</span>
          <strong>
            {isLoading ? 'Loading...' : summary ? gbp.format(summary.dailyPnl) : '--'}
          </strong>
        </article>
      </section>

      <section className="content-grid">
        <article className="panel">
          <h2>Watchlist</h2>
          <div className="table">
            {isLoading && <p>Loading market data...</p>}
            {!isLoading &&
              summary?.watchlist.map((item) => (
                <div className="watchlist-row" key={item.symbol}>
                  <div className="watchlist-main">
                    <span>{item.symbol}</span>
                    <span>{gbp.format(item.price)}</span>
                    <span className={item.change >= 0 ? 'positive' : 'negative'}>
                      {item.change >= 0 ? '+' : ''}
                      {item.change.toFixed(2)}%
                    </span>
                  </div>
                  <div className="trade-controls">
                    <input
                      className="quantity-input"
                      min="1"
                      step="1"
                      type="number"
                      value={tradeQuantity[item.symbol] ?? 1}
                      onChange={(event) =>
                        setTradeQuantity((current) => ({
                          ...current,
                          [item.symbol]: Math.max(1, Number(event.target.value) || 1),
                        }))
                      }
                    />
                    <button
                      className="trade-button buy-button"
                      disabled={activeTradeKey !== null}
                      onClick={() => handleTrade(item.symbol, 'buy')}
                      type="button"
                    >
                      {activeTradeKey === `buy-${item.symbol}` ? 'Buying...' : 'Buy'}
                    </button>
                    <button
                      className="trade-button sell-button"
                      disabled={activeTradeKey !== null}
                      onClick={() => handleTrade(item.symbol, 'sell')}
                      type="button"
                    >
                      {activeTradeKey === `sell-${item.symbol}` ? 'Selling...' : 'Sell'}
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </article>

        <article className="panel">
          <h2>Holdings P&amp;L</h2>
          <div className="pnl-table">
            <div className="pnl-header">
              <span>Symbol</span>
              <span>Shares</span>
              <span>Avg Price</span>
              <span>Live Price</span>
              <span>P&amp;L / Share</span>
              <span>Total P&amp;L</span>
            </div>
            {isLoading && <p>Loading positions...</p>}
            {!isLoading && positionsWithPnl.length === 0 && <p>No shares held yet.</p>}
            {!isLoading &&
              positionsWithPnl.map((item) => (
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
                  </button>

                  {selectedHolding === item.symbol && (
                    <div className="holding-lots">
                      <p className="holding-lots-title">{item.symbol} Buy Lots</p>
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
                    </div>
                  )}
                </div>
              ))}
          </div>
        </article>
      </section>

      <section className="history-section">
        <article className="panel">
          <h2>Trade History</h2>
          <div className="history-table">
            <div className="history-header">
              <span>Time</span>
              <span>Side</span>
              <span>Symbol</span>
              <span>Shares</span>
              <span>Price</span>
              <span>Gross</span>
              <span>Commission</span>
              <span>Net</span>
            </div>
            {isLoading && <p>Loading history...</p>}
            {!isLoading && summary && summary.history.length === 0 && <p>No trades yet.</p>}
            {!isLoading &&
              summary?.history.map((trade) => (
                <div className="history-row" key={trade.id}>
                  <span>{dateTime.format(new Date(trade.timestamp))}</span>
                  <span className={trade.side === 'BUY' ? 'positive' : 'negative'}>
                    {trade.side}
                  </span>
                  <span>{trade.symbol}</span>
                  <span>{trade.quantity}</span>
                  <span>{gbp.format(trade.price)}</span>
                  <span>{gbp.format(trade.grossTotal)}</span>
                  <span>{gbp.format(trade.commission)}</span>
                  <span>{gbp.format(trade.netTotal)}</span>
                </div>
              ))}
          </div>
        </article>
      </section>
    </main>
  );
}
