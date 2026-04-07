import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { MarketsService } from './markets.service';
import { SessionAuthGuard } from '../auth/session-auth.guard';

type TradeRequest = {
  symbol: string;
  quantity: number;
};

type WatchlistRequest = {
  symbol: string;
};

@Controller('markets')
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  @Get('summary')
  @UseGuards(SessionAuthGuard)
  getSummary(@Req() request: Request & { user: { id: string } }) {
    return this.marketsService.getSummary(request.user.id);
  }

  @Post('buy')
  @UseGuards(SessionAuthGuard)
  buyShares(
    @Req() request: Request & { user: { id: string } },
    @Body() trade: TradeRequest,
  ) {
    return this.marketsService.buyShares(request.user.id, trade.symbol, trade.quantity);
  }

  @Post('sell')
  @UseGuards(SessionAuthGuard)
  sellShares(
    @Req() request: Request & { user: { id: string } },
    @Body() trade: TradeRequest,
  ) {
    return this.marketsService.sellShares(request.user.id, trade.symbol, trade.quantity);
  }

  @Post('watchlist')
  @UseGuards(SessionAuthGuard)
  toggleWatchlist(
    @Req() request: Request & { user: { id: string } },
    @Body() watchlist: WatchlistRequest,
  ) {
    return this.marketsService.toggleWatchlist(request.user.id, watchlist.symbol);
  }
}
