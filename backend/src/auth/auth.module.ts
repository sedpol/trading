import { Module } from '@nestjs/common';
import { AuthRateLimitService } from './auth-rate-limit.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionAuthGuard } from './session-auth.guard';

@Module({
  controllers: [AuthController],
  providers: [AuthRateLimitService, AuthService, SessionAuthGuard],
  exports: [AuthRateLimitService, AuthService, SessionAuthGuard],
})
export class AuthModule {}
