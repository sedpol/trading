import { describe, expect, it } from 'vitest';
import { AuthService } from './auth.service';
import { SESSION_COOKIE_NAME } from './auth.types';

const DEMO_IDENTIFIER = process.env.DEMO_AUTH_USERNAME ?? 'trader';
const DEMO_PASSWORD = process.env.DEMO_AUTH_PASSWORD ?? 'test-demo-password';

describe('AuthService token extraction', () => {
  const service = new AuthService();

  it('reads x-session-token from case-insensitive header names', () => {
    const token = service.extractSessionToken({
      headers: {
        'X-Session-Token': 'header-token',
      },
    });

    expect(token).toBe('header-token');
  });

  it('reads cookie token from parsed request cookies', () => {
    const token = service.extractSessionToken({
      cookies: {
        [SESSION_COOKIE_NAME]: 'cookie-token',
      },
    });

    expect(token).toBe('cookie-token');
  });

  it('reads bearer token from websocket auth payload', () => {
    const token = service.extractSessionToken({
      auth: {
        authorization: 'Bearer ws-token',
      },
    });

    expect(token).toBe('ws-token');
  });

  it('uses the same cookie source in resolveSessionFromHttpRequest as protected routes', () => {
    const session = service.login({ identifier: DEMO_IDENTIFIER, password: DEMO_PASSWORD });

    const resolved = service.resolveSessionFromHttpRequest({
      cookies: {
        [SESSION_COOKIE_NAME]: session.token,
      },
    });

    expect(resolved?.token).toBe(session.token);
    expect(resolved?.user.id).toBe('user-demo-1');
  });

  it('does not fail when cookie token cannot be decoded as URI component', () => {
    const token = service.extractSessionToken({
      headers: {
        Cookie: `${SESSION_COOKIE_NAME}=%E0%A4%A`,
      },
    });

    expect(token).toBe('%E0%A4%A');
  });
});
