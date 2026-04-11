import { Module } from '@nestjs/common';
import { MarketsController } from './markets.controller';
import { MarketsGateway } from './markets.gateway';
import { MarketsService } from './markets.service';
import { AlphaVantageService } from './alpha-vantage.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [MarketsController],
  providers: [MarketsService, MarketsGateway, AlphaVantageService],
})
export class MarketsModule {}
