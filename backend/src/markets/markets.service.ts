import { BadRequestException, Injectable } from '@nestjs/common';

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

@Injectable()
export class MarketsService {
  private cashBalance = 20000;
  private readonly manualWatchlistSymbols = new Set<string>(['AAPL', 'GOOG', 'NVDA', 'MSFT', 'AMZN']);

  private readonly positionLots: Record<string, PositionLot[]> = {};
  private readonly tradeHistory: TradeHistoryItem[] = [];

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

  getSummary(): MarketSummary {
    return {
      balance: this.calculateBalance(),
      cashBalance: Number(this.cashBalance.toFixed(2)),
      dailyPnl: this.calculateDailyPnl(),
      watchlist: this.getSelectedWatchlist(),
      allMarkets: this.allMarkets,
      positions: this.getPositions(),
      history: [...this.tradeHistory].reverse(),
    };
  }

  toggleWatchlist(symbol: string) {
    const normalizedSymbol = this.validateSymbol(symbol);

    this.findMarketItem(normalizedSymbol);

    if (this.getOwnedQuantity(normalizedSymbol) > 0) {
      return this.getSummary();
    }

    if (this.manualWatchlistSymbols.has(normalizedSymbol)) {
      this.manualWatchlistSymbols.delete(normalizedSymbol);
    } else {
      this.manualWatchlistSymbols.add(normalizedSymbol);
    }

    return this.getSummary();
  }

  buyShares(symbol: string, quantity: number) {
    const normalizedSymbol = this.validateSymbol(symbol);
    const normalizedQuantity = this.validateQuantity(quantity);
    const marketItem = this.findMarketItem(normalizedSymbol);
    const grossTotal = Number((marketItem.price * normalizedQuantity).toFixed(2));
    const commission = this.calculateCommission('BUY', grossTotal);
    const netTotal = Number((grossTotal + commission).toFixed(2));

    if (netTotal > this.cashBalance) {
      throw new BadRequestException('Not enough cash to complete this buy order.');
    }

    const lots = this.getOrCreateLots(normalizedSymbol);
    lots.push({
      quantity: normalizedQuantity,
      boughtPrice: marketItem.price,
    });

    this.manualWatchlistSymbols.add(normalizedSymbol);

    this.cashBalance = Number((this.cashBalance - netTotal).toFixed(2));
    this.recordTrade(
      normalizedSymbol,
      'BUY',
      normalizedQuantity,
      marketItem.price,
      grossTotal,
      commission,
      netTotal,
    );

    return this.getSummary();
  }

  sellShares(symbol: string, quantity: number) {
    const normalizedSymbol = this.validateSymbol(symbol);
    const normalizedQuantity = this.validateQuantity(quantity);
    const marketItem = this.findMarketItem(normalizedSymbol);
    const lots = this.positionLots[normalizedSymbol] ?? [];
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
      delete this.positionLots[normalizedSymbol];
    }

    const grossTotal = Number((marketItem.price * normalizedQuantity).toFixed(2));
    const commission = this.calculateCommission('SELL', grossTotal);
    const netTotal = Number((grossTotal - commission).toFixed(2));

    this.cashBalance = Number((this.cashBalance + netTotal).toFixed(2));
    this.recordTrade(
      normalizedSymbol,
      'SELL',
      normalizedQuantity,
      marketItem.price,
      grossTotal,
      commission,
      netTotal,
    );

    return this.getSummary();
  }

  updateWatchlistPrices(): MarketSummary {
    this.allMarkets.forEach((item) => {
      const direction = Math.random() < 0.5 ? -1 : 1;
      const delta = Number((Math.random() * 0.58).toFixed(2));
      const nextPrice = Number(
        Math.max(0, item.price + (item.price * direction * delta) / 100).toFixed(2),
      );
      const percentChange =
        item.startPrice === 0
          ? 0
          : Number((((nextPrice - item.startPrice) / item.startPrice) * 100).toFixed(2));

      item.price = nextPrice;
      item.change = percentChange;
    });

    return this.getSummary();
  }

  private getPositions(): Position[] {
    return Object.entries(this.positionLots)
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

  private getSelectedWatchlist() {
    const selectedSymbols = new Set(this.manualWatchlistSymbols);

    this.getPositions().forEach((position) => {
      if (position.quantity > 0) {
        selectedSymbols.add(position.symbol);
      }
    });

    return this.allMarkets.filter((item) => selectedSymbols.has(item.symbol));
  }

  private calculateBalance() {
    const positionsValue = this.getPositions().reduce((total, position) => {
      const marketItem = this.allMarkets.find((item) => item.symbol === position.symbol);
      const currentPrice = marketItem?.price ?? position.averagePrice;
      return total + position.quantity * currentPrice;
    }, 0);

    return Number((this.cashBalance + positionsValue).toFixed(2));
  }

  private calculateDailyPnl() {
    return Number(
      this.getPositions()
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

  private getOwnedQuantity(symbol: string) {
    return (this.positionLots[symbol] ?? []).reduce((total, lot) => total + lot.quantity, 0);
  }

  private getOrCreateLots(symbol: string) {
    if (!this.positionLots[symbol]) {
      this.positionLots[symbol] = [];
    }

    return this.positionLots[symbol];
  }

  private calculateCommission(side: 'BUY' | 'SELL', grossTotal: number) {
    const rate = side === 'BUY' ? 0.001 : 0.002;
    return Number((1 + grossTotal * rate).toFixed(2));
  }

  private recordTrade(
    symbol: string,
    side: 'BUY' | 'SELL',
    quantity: number,
    price: number,
    grossTotal: number,
    commission: number,
    netTotal: number,
  ) {
    this.tradeHistory.push({
      id: `${Date.now()}-${this.tradeHistory.length + 1}`,
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
