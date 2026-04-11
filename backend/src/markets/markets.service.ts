import { BadRequestException, Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { AlphaVantageService } from './alpha-vantage.service';

type WatchlistItem = {
  symbol: string;
  companyName: string;
  startPrice: number;
  price: number;
  change: number;
};

type PositionLot = {
  quantity: number;
  boughtPrice: number;
};

type Position = {
  symbol: string;
  quantity: number;
  averagePrice: number;
  lots: PositionLot[];
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

type MarketSummary = {
  balance: number;
  cashBalance: number;
  dailyPnl: number;
  watchlist: WatchlistItem[];
  allMarkets: WatchlistItem[];
  positions: Position[];
  history: TradeHistoryItem[];
};

type UserMarketState = {
  cashBalance: number;
  manualWatchlistSymbols: Set<string>;
  positionLots: Record<string, PositionLot[]>;
  tradeHistory: TradeHistoryItem[];
};

const INITIAL_CASH_BALANCE = 20000;
const DEFAULT_WATCHLIST_SYMBOLS = ['AAPL', 'GOOG', 'MSFT', 'NVDA', 'AMZN'];
const ALPHA_VANTAGE_FREE_TIER_THROTTLE_MS = 1100;
const MARKET_REFRESH_INTERVAL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class MarketsService implements OnModuleInit, OnModuleDestroy {
  private readonly userStates = new Map<string, UserMarketState>();
  private refreshInterval: NodeJS.Timeout | null = null;
  private refreshPromise: Promise<void> | null = null;

  constructor(private readonly alphaVantageService: AlphaVantageService) {}

  async onModuleInit(): Promise<void> {
    await this.refreshAllSymbols();

    this.refreshInterval = setInterval(() => {
      void this.refreshAllSymbols();
    }, MARKET_REFRESH_INTERVAL_MS);
  }

  onModuleDestroy(): void {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }

  private async refreshAllSymbols(): Promise<void> {
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.refreshAllSymbolsInternal();

    try {
      await this.refreshPromise;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async refreshAllSymbolsInternal(): Promise<void> {
    for (const item of this.allMarkets) {
      const result = await this.alphaVantageService.fetchQuote(item.symbol);

      if (result !== null) {
        item.price = result.price;
        item.change = Math.abs(result.change);
        item.startPrice = result.startPrice;
      } else {
        console.warn(`MarketsService: no quote for ${item.symbol}, retaining cached price`);
      }

      // Alpha Vantage free-tier quote requests are single-symbol calls, so we pace them.
      await new Promise((resolve) => setTimeout(resolve, ALPHA_VANTAGE_FREE_TIER_THROTTLE_MS));
    }
  }

  private readonly allMarkets: WatchlistItem[] = [
    { symbol: 'AAPL', companyName: 'Apple Inc.', startPrice: 212.48, price: 212.48, change: 0 },
    { symbol: 'GOOG', companyName: 'Alphabet Inc.', startPrice: 176.91, price: 176.91, change: 0 },
    { symbol: 'NVDA', companyName: 'NVIDIA Corporation', startPrice: 942.65, price: 942.65, change: 0 },
    { symbol: 'MSFT', companyName: 'Microsoft Corporation', startPrice: 343.12, price: 343.12, change: 0 },
    { symbol: 'AMZN', companyName: 'Amazon.com, Inc.', startPrice: 176.90, price: 176.90, change: 0 },
    { symbol: 'META', companyName: 'Meta Platforms, Inc.', startPrice: 462.82, price: 462.82, change: 0 },
    { symbol: 'ORCL', companyName: 'Oracle Corporation', startPrice: 92.14, price: 92.14, change: 0 },
    { symbol: 'INTC', companyName: 'Intel Corporation', startPrice: 49.02, price: 49.02, change: 0 },
    { symbol: 'JPM', companyName: 'JPMorgan Chase & Co.', startPrice: 130.56, price: 130.56, change: 0 },
    { symbol: 'WMT', companyName: 'Walmart Inc.', startPrice: 151.23, price: 151.23, change: 0 },
    { symbol: 'PFE', companyName: 'Pfizer Inc.', startPrice: 38.65, price: 38.65, change: 0 },
    { symbol: 'NFLX', companyName: 'Netflix, Inc.', startPrice: 518.74, price: 518.74, change: 0 },
    { symbol: 'IBM', companyName: 'International Business Machines Corporation', startPrice: 146.81, price: 146.81, change: 0 },
    { symbol: 'CRM', companyName: 'Salesforce, Inc.', startPrice: 214.32, price: 214.32, change: 0 },
    { symbol: 'COIN', companyName: 'Coinbase Global, Inc.', startPrice: 80.45, price: 80.45, change: 0 },
    { symbol: 'SBUX', companyName: 'Starbucks Corporation', startPrice: 94.88, price: 94.88, change: 0 },
    { symbol: 'BABA', companyName: 'Alibaba Group Holding Limited', startPrice: 88.07, price: 88.07, change: 0 },
    { symbol: 'AMD', companyName: 'Advanced Micro Devices, Inc.', startPrice: 122.36, price: 122.36, change: 0 },
    { symbol: 'PG', companyName: 'The Procter & Gamble Company', startPrice: 149.55, price: 149.55, change: 0 },
    { symbol: 'UNH', companyName: 'UnitedHealth Group Incorporated', startPrice: 575.28, price: 575.28, change: 0 },
  ];

  getSummary(userId?: string): MarketSummary {
    const state = userId ? this.getOrCreateUserState(userId) : this.createPublicState();

    return this.buildSummary(state);
  }

  toggleWatchlist(userId: string, symbol: string) {
    const state = this.getOrCreateUserState(userId);
    return {
      ...this.updateWatchlistState(state, symbol),
    };
  }

  buyShares(userId: string, symbol: string, quantity: number) {
    const state = this.getOrCreateUserState(userId);
    const normalizedSymbol = this.validateSymbol(symbol);
    const normalizedQuantity = this.validateQuantity(quantity);
    const marketItem = this.findMarketItem(normalizedSymbol);
    const grossTotal = Number((marketItem.price * normalizedQuantity).toFixed(2));
    const commission = this.calculateCommission('BUY', grossTotal);
    const netTotal = Number((grossTotal + commission).toFixed(2));

    if (netTotal > state.cashBalance) {
      throw new BadRequestException('Not enough cash to complete this buy order.');
    }

    const lots = this.getOrCreateLots(state, normalizedSymbol);
    lots.push({
      quantity: normalizedQuantity,
      boughtPrice: marketItem.price,
    });

    state.manualWatchlistSymbols.add(normalizedSymbol);

    state.cashBalance = Number((state.cashBalance - netTotal).toFixed(2));
    this.recordTrade(
      state,
      normalizedSymbol,
      'BUY',
      normalizedQuantity,
      marketItem.price,
      grossTotal,
      commission,
      netTotal,
    );

    return this.buildSummary(state);
  }

  sellShares(userId: string, symbol: string, quantity: number) {
    const state = this.getOrCreateUserState(userId);
    const normalizedSymbol = this.validateSymbol(symbol);
    const normalizedQuantity = this.validateQuantity(quantity);
    const marketItem = this.findMarketItem(normalizedSymbol);
    const lots = state.positionLots[normalizedSymbol] ?? [];
    const ownedQuantity = lots.reduce((total, lot) => total + lot.quantity, 0);

    if (ownedQuantity < normalizedQuantity) {
      throw new BadRequestException('Not enough shares to complete this sell order.');
    }

    let remainingQuantity = normalizedQuantity;

    while (remainingQuantity > 0) {
      const currentLot = lots[0];

      if (currentLot.quantity <= remainingQuantity) {
        remainingQuantity -= currentLot.quantity;
        lots.shift();
      } else {
        currentLot.quantity -= remainingQuantity;
        remainingQuantity = 0;
      }
    }

    if (lots.length === 0) {
      delete state.positionLots[normalizedSymbol];
    }

    const grossTotal = Number((marketItem.price * normalizedQuantity).toFixed(2));
    const commission = this.calculateCommission('SELL', grossTotal);
    const netTotal = Number((grossTotal - commission).toFixed(2));

    state.cashBalance = Number((state.cashBalance + netTotal).toFixed(2));
    this.recordTrade(
      state,
      normalizedSymbol,
      'SELL',
      normalizedQuantity,
      marketItem.price,
      grossTotal,
      commission,
      netTotal,
    );

    return this.buildSummary(state);
  }

  updateWatchlistPrices(): MarketSummary {
    return this.getSummary();
  }

  private buildSummary(state: UserMarketState): MarketSummary {
    return {
      balance: this.calculateBalance(state),
      cashBalance: Number(state.cashBalance.toFixed(2)),
      dailyPnl: this.calculateDailyPnl(state),
      watchlist: this.getSelectedWatchlist(state),
      allMarkets: this.allMarkets,
      positions: this.getPositions(state),
      history: [...state.tradeHistory].reverse(),
    };
  }

  private createPublicState(): UserMarketState {
    return {
      cashBalance: INITIAL_CASH_BALANCE,
      manualWatchlistSymbols: new Set(DEFAULT_WATCHLIST_SYMBOLS),
      positionLots: {},
      tradeHistory: [],
    };
  }

  private getOrCreateUserState(userId: string): UserMarketState {
    let state = this.userStates.get(userId);

    if (!state) {
      state = {
        cashBalance: INITIAL_CASH_BALANCE,
        manualWatchlistSymbols: new Set(DEFAULT_WATCHLIST_SYMBOLS),
        positionLots: {},
        tradeHistory: [],
      };
      this.userStates.set(userId, state);
    }

    return state;
  }

  private updateWatchlistState(state: UserMarketState, symbol: string) {
    const normalizedSymbol = this.validateSymbol(symbol);

    this.findMarketItem(normalizedSymbol);

    if (this.getOwnedQuantity(state, normalizedSymbol) > 0) {
      return this.buildSummary(state);
    }

    if (state.manualWatchlistSymbols.has(normalizedSymbol)) {
      state.manualWatchlistSymbols.delete(normalizedSymbol);
    } else {
      state.manualWatchlistSymbols.add(normalizedSymbol);
    }

    return this.buildSummary(state);
  }

  private getPositions(state: UserMarketState): Position[] {
    return Object.entries(state.positionLots)
      .map(([symbol, lots]) => {
        const quantity = lots.reduce((total, lot) => total + lot.quantity, 0);

        if (quantity === 0) {
          return null;
        }

        const totalCost = lots.reduce(
          (total, lot) => total + lot.quantity * lot.boughtPrice,
          0,
        );

        return {
          symbol,
          quantity,
          averagePrice: Number((totalCost / quantity).toFixed(2)),
          lots: lots.map((lot) => ({ ...lot })),
        };
      })
      .filter((position): position is Position => position !== null)
      .sort((left, right) => left.symbol.localeCompare(right.symbol));
  }

  private getSelectedWatchlist(state: UserMarketState) {
    const selectedSymbols = new Set(state.manualWatchlistSymbols);

    this.getPositions(state).forEach((position) => {
      if (position.quantity > 0) {
        selectedSymbols.add(position.symbol);
      }
    });

    return this.allMarkets.filter((item) => selectedSymbols.has(item.symbol));
  }

  private calculateBalance(state: UserMarketState) {
    const positionsValue = this.getPositions(state).reduce((total, position) => {
      const marketItem = this.allMarkets.find((item) => item.symbol === position.symbol);
      const currentPrice = marketItem?.price ?? position.averagePrice;
      return total + position.quantity * currentPrice;
    }, 0);

    return Number((state.cashBalance + positionsValue).toFixed(2));
  }

  private calculateDailyPnl(state: UserMarketState) {
    return Number(
      this.getPositions(state)
        .reduce((total, position) => {
          const marketItem = this.allMarkets.find((item) => item.symbol === position.symbol);

          if (!marketItem) {
            return total;
          }

          return total + (marketItem.price - position.averagePrice) * position.quantity;
        }, 0)
        .toFixed(2),
    );
  }

  private validateSymbol(symbol: string) {
    const normalizedSymbol = symbol?.trim().toUpperCase();

    if (!normalizedSymbol) {
      throw new BadRequestException('A symbol is required.');
    }

    return normalizedSymbol;
  }

  private validateQuantity(quantity: number) {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new BadRequestException('Quantity must be a positive whole number.');
    }

    return quantity;
  }

  private findMarketItem(symbol: string) {
    const marketItem = this.allMarkets.find((item) => item.symbol === symbol);

    if (!marketItem) {
      throw new BadRequestException('Symbol not found in watchlist.');
    }

    return marketItem;
  }

  private getOwnedQuantity(state: UserMarketState, symbol: string) {
    return (state.positionLots[symbol] ?? []).reduce((total, lot) => total + lot.quantity, 0);
  }

  private getOrCreateLots(state: UserMarketState, symbol: string) {
    if (!state.positionLots[symbol]) {
      state.positionLots[symbol] = [];
    }

    return state.positionLots[symbol];
  }

  private calculateCommission(side: 'BUY' | 'SELL', grossTotal: number) {
    const rate = side === 'BUY' ? 0.001 : 0.002;
    return Number((1 + grossTotal * rate).toFixed(2));
  }

  private recordTrade(
    state: UserMarketState,
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: number,
    price: number,
    grossTotal: number,
    commission: number,
    netTotal: number,
  ) {
    state.tradeHistory.push({
      id: `${Date.now()}-${state.tradeHistory.length + 1}`,
      symbol,
      side,
      quantity,
      price,
      grossTotal,
      commission,
      netTotal,
      timestamp: new Date().toISOString(),
    });
  }
}
