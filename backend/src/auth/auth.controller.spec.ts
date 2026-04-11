import { describe, expect, it, vi } from 'vitest';
import { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import { AuthRateLimitService } from './auth-rate-limit.service';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  it('returns a mobile-usable session token and expiry on login while still setting the cookie', () => {
    const session = {
      token: 'session-token-123',
      expiresAt: Date.now() + 60_000,
      user: {
        id: 'user-demo-1',
        username: 'trader',
        email: 'trader@example.com',
      },
    };
    const authService = {
      login: vi.fn().mockReturnValue(session),
    } as unknown as AuthService;
    const authRateLimitService = {
      assertLoginAllowed: vi.fn(),
      reset: vi.fn(),
      recordFailedAttempt: vi.fn(),
    } as unknown as AuthRateLimitService;
    const response = {
      cookie: vi.fn(),
    } as unknown as Response;
    const request = {
      headers: {},
      ip: '127.0.0.1',
    } as Request;
    const controller = new AuthController(authService, authRateLimitService);

    const result = controller.login(
      {
        identifier: 'trader',
        password: 'password',
      },
      request,
      response,
    );

    expect(authRateLimitService.assertLoginAllowed).toHaveBeenCalledWith('127.0.0.1:trader');
    expect(authService.login).toHaveBeenCalledWith({
      identifier: 'trader',
      password: 'password',
    });
    expect(authRateLimitService.reset).toHaveBeenCalledWith('127.0.0.1:trader');
    expect(response.cookie).toHaveBeenCalledOnce();
    expect(result).toEqual({
      authenticated: true,
      sessionToken: 'session-token-123',
      expiresAt: session.expiresAt,
      user: session.user,
    });
  });
});