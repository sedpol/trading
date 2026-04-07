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
import { AuthService } from './auth.service';
import { LoginRequest, SESSION_COOKIE_NAME, SessionResponse } from './auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: LoginRequest, @Res({ passthrough: true }) response: Response): SessionResponse {
    const session = this.authService.login(body);

    response.cookie(SESSION_COOKIE_NAME, session.token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
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

    this.authService.logout(session?.token);

    response.clearCookie(SESSION_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      secure: false,
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
