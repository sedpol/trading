import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MarketsModule } from './markets/markets.module';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [AuthModule, MarketsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

