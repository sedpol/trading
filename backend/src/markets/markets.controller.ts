import { Body, Controller, Get, Post } from '@nestjs/common';
import { MarketsService } from './markets.service';

type TradeRequest = {
  symbol: string;
  quantity: number;
};

@Controller('markets')
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  @Get('summary')
  getSummary() {
    return this.marketsService.getSummary();
  }

  @Post('buy')
  buyShares(@Body() trade: TradeRequest) {
    return this.marketsService.buyShares(trade.symbol, trade.quantity);
  }

  @Post('sell')
  sellShares(@Body() trade: TradeRequest) {
    return this.marketsService.sellShares(trade.symbol, trade.quantity);
  }
}
