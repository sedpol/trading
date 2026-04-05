export type PositionLot = {
  quantity: number;
  boughtPrice: number;
};

export type TradeHistoryItem = {
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

export type WatchlistItem = {
  symbol: string;
  companyName: string;
  startPrice: number;
  price: number;
  change: number;
};

export type Position = {
  symbol: string;
  quantity: number;
  averagePrice: number;
  lots: PositionLot[];
};

export type Summary = {
  balance: number;
  cashBalance: number;
  dailyPnl: number;
  watchlist: WatchlistItem[];
  positions: Position[];
  history: TradeHistoryItem[];
};
