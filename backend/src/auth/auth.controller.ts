import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthRateLimitService } from './auth-rate-limit.service';
import { AuthService } from './auth.service';
import { LoginRequest, SESSION_COOKIE_NAME, SessionResponse } from './auth.types';

const shouldUseSecureCookies = () => {
  const explicitSetting = process.env.AUTH_COOKIE_SECURE?.trim().toLowerCase();

  if (explicitSetting === 'true') {
    return true;
  }

  if (explicitSetting === 'false') {
    return false;
  }

  return process.env.NODE_ENV === 'production';
};

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authRateLimitService: AuthRateLimitService,
  ) {}

  @Post('login')
  login(
    @Body() body: LoginRequest,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): SessionResponse {
    const rateLimitKey = getRateLimitKey(request, body?.identifier);

    this.authRateLimitService.assertLoginAllowed(rateLimitKey);

    let session;

    try {
      session = this.authService.login(body);
      this.authRateLimitService.reset(rateLimitKey);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        this.authRateLimitService.recordFailedAttempt(rateLimitKey);
      }

      throw error;
    }

    const secure = shouldUseSecureCookies();

    response.cookie(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      maxAge: session.expiresAt - Date.now(),
      path: '/',
    });

    return {
      authenticated: true,
      user: session.user,
    };
  }

  @Post('logout')
  logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) {
    const session = this.authService.resolveSessionFromHttpRequest({
      headers: request.headers as Record<string, unknown>,
      cookies: request.cookies as Record<string, unknown> | undefined,
    });
    const secure = shouldUseSecureCookies();

    this.authService.logout(session?.token);

    response.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
    });

    return {
      authenticated: false,
    };
  }

  @Get('session')
  getSession(@Req() request: Request): SessionResponse {
    const session = this.authService.resolveSessionFromHttpRequest({
      headers: request.headers as Record<string, unknown>,
      cookies: request.cookies as Record<string, unknown> | undefined,
    });

    if (!session) {
      throw new UnauthorizedException('Unauthorized');
    }

    return {
      authenticated: true,
      user: session.user,
    };
  }
}

const getRateLimitKey = (request: Request, identifier?: string) => {
  const forwardedFor = request.headers['x-forwarded-for'];
  const headerIp = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor;
  const forwardedIp = typeof headerIp === 'string' ? headerIp.split(',')[0]?.trim() : undefined;
  const requestIp = request.ip?.trim();
  const normalizedIdentifier = identifier?.trim().toLowerCase() || 'unknown-identifier';

  return `${forwardedIp || requestIp || 'unknown-ip'}:${normalizedIdentifier}`;
};
