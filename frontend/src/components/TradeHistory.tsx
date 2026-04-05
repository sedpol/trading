import { TradeHistoryItem } from '../types';

type TradeHistoryProps = {
  isLoading: boolean;
  history: TradeHistoryItem[];
};

const gbp = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
});

const dateTime = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium',
  timeStyle: 'medium',
});

export function TradeHistory({ isLoading, history }: TradeHistoryProps) {
  return (
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
        <div className="history-scroll">
          {isLoading && <p>Loading history...</p>}
          {!isLoading && history.length === 0 && <p>No trades yet.</p>}
          {!isLoading &&
            history.map((trade) => (
              <div className="history-row" key={trade.id}>
                <span>{dateTime.format(new Date(trade.timestamp))}</span>
                <span className={trade.side === 'BUY' ? 'positive' : 'negative'}>{trade.side}</span>
                <span>{trade.symbol}</span>
                <span>{trade.quantity}</span>
                <span>{gbp.format(trade.price)}</span>
                <span>{gbp.format(trade.grossTotal)}</span>
                <span>{gbp.format(trade.commission)}</span>
                <span>{gbp.format(trade.netTotal)}</span>
              </div>
            ))}
        </div>
      </div>
    </article>
  );
}
