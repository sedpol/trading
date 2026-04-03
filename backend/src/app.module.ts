import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MarketsModule } from './markets/markets.module';

@Module({
  imports: [MarketsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

