import { extractSessionToken, loginRequest, parseSessionCookie, validateSession } from './auth';

type MockResponseInit = {
  body?: unknown;
  headers?: Record<string, string>;
  status?: number;
};

const createResponse = ({ body, headers = {}, status = 200 }: MockResponseInit) => ({
  headers: {
    get: (name: string) => headers[name.toLowerCase()] ?? headers[name] ?? null,
  },
  ok: status >= 200 && status < 300,
  status,
  text: async () => (body === undefined ? '' : JSON.stringify(body)),
}) as Response;

describe('auth api helpers', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('parses the session cookie token from a set-cookie header', () => {
    expect(parseSessionCookie('trading_sid=token-123; Path=/; HttpOnly')).toBe('token-123');
  });

  it('prefers a sessionToken field when extracting a reusable session token', () => {
    const response = createResponse({
      headers: {
        'set-cookie': 'trading_sid=cookie-token; Path=/; HttpOnly',
      },
    });

    expect(extractSessionToken(response, { authenticated: true, sessionToken: 'body-token' })).toBe('body-token');
  });

  it('returns a reusable session and user when login succeeds with a mobile token', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(createResponse({
      body: {
        authenticated: true,
        expiresAt: 12345,
        sessionToken: 'session-token',
        user: {
          email: 'trader@example.com',
          id: 'user-1',
          username: 'trader',
        },
      },
    }));

    const result = await loginRequest('trader', 'password');

    expect(result).toEqual({
      ok: true,
      session: {
        expiresAt: 12345,
        identifier: 'trader',
        token: 'session-token',
      },
      user: {
        email: 'trader@example.com',
        id: 'user-1',
        identifier: 'trader',
        username: 'trader',
      },
    });
  });

  it('fails clearly when login succeeds but no reusable mobile token is returned', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(createResponse({
      body: {
        authenticated: true,
        user: {
          email: 'trader@example.com',
          id: 'user-1',
          username: 'trader',
        },
      },
    }));

    const result = await loginRequest('trader', 'password');

    expect(result).toEqual({
      ok: false,
      message: 'Sign in succeeded, but the backend did not return a reusable mobile session token.',
    });
  });

  it('marks a stored token as unauthenticated when the backend rejects session validation', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(createResponse({
      body: {
        authenticated: false,
      },
      status: 401,
    }));

    const result = await validateSession({
      identifier: 'trader',
      token: 'stale-token',
    });

    expect(result).toEqual({ state: 'unauthenticated' });
  });
});
