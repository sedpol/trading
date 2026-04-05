type BuySellProps = {
  symbol: string;
  quantity: number;
  activeTradeKey: string | null;
  onQuantityChange: (quantity: number) => void;
  onTrade: (side: 'buy' | 'sell') => void;
};

export function BuySell({
  symbol,
  quantity,
  activeTradeKey,
  onQuantityChange,
  onTrade,
}: BuySellProps) {
  return (
    <div className="trade-controls">
      <input
        className="quantity-input"
        min="1"
        step="1"
        type="number"
        value={quantity}
        onChange={(event) => onQuantityChange(Math.max(1, Number(event.target.value) || 1))}
        aria-label={`Quantity for ${symbol}`}
      />
      <button
        className="trade-button buy-button"
        disabled={activeTradeKey !== null}
        onClick={() => onTrade('buy')}
        type="button"
      >
        {activeTradeKey === `buy-${symbol}` ? 'Buying...' : 'Buy'}
      </button>
      <button
        className="trade-button sell-button"
        disabled={activeTradeKey !== null}
        onClick={() => onTrade('sell')}
        type="button"
      >
        {activeTradeKey === `sell-${symbol}` ? 'Selling...' : 'Sell'}
      </button>
    </div>
  );
}
