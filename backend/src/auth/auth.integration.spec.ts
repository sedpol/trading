import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';
import { AlphaVantageService } from '../markets/alpha-vantage.service';

const DEMO_IDENTIFIER = process.env.DEMO_AUTH_USERNAME ?? 'trader';
const DEMO_PASSWORD = process.env.DEMO_AUTH_PASSWORD ?? 'test-demo-password';

const mockAlphaVantageService = {
  fetchQuote: () => Promise.resolve(null),
};

describe('Auth + Markets integration', () => {
  let app: INestApplication;
  let httpServer: ReturnType<INestApplication['getHttpServer']>;

  const getSessionCookie = async () => {
    const login = await request(httpServer)
      .post('/auth/login')
      .send({ identifier: DEMO_IDENTIFIER, password: DEMO_PASSWORD });

    expect(login.status).toBe(201);
    const cookies = login.headers['set-cookie'];
    expect(cookies).toBeDefined();

    return cookies;
  };

  beforeEach(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AlphaVantageService)
      .useValue(mockAlphaVantageService)
      .compile();

    app = testingModule.createNestApplication();
    await app.init();
    httpServer = app.getHttpServer();
  });

  afterEach(async () => {
    await app.close();
  });

  it('blocks unauthenticated markets summary reads', async () => {
    const response = await request(httpServer).get('/markets/summary');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized');
  });

  it('blocks unauthenticated watchlist mutations', async () => {
    const response = await request(httpServer)
      .post('/markets/watchlist')
      .send({ symbol: 'NFLX' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized');
  });

  it('blocks unauthenticated trade mutations', async () => {
    const buy = await request(httpServer)
      .post('/markets/buy')
      .send({ symbol: 'AAPL', quantity: 1 });

    expect(buy.status).toBe(401);
    expect(buy.body.message).toBe('Unauthorized');

    const sell = await request(httpServer)
      .post('/markets/sell')
      .send({ symbol: 'AAPL', quantity: 1 });

    expect(sell.status).toBe(401);
    expect(sell.body.message).toBe('Unauthorized');
  });

  it('allows authenticated watchlist reads and writes', async () => {
    const cookie = await getSessionCookie();

    const summary = await request(httpServer)
      .get('/markets/summary')
      .set('Cookie', cookie);

    expect(summary.status).toBe(200);
    expect(Array.isArray(summary.body.watchlist)).toBe(true);

    const toggle = await request(httpServer)
      .post('/markets/watchlist')
      .set('Cookie', cookie)
      .send({ symbol: 'NFLX' });

    expect(toggle.status).toBe(201);
    expect(toggle.body.watchlist.map((item: { symbol: string }) => item.symbol)).toContain('NFLX');
  });

  it('allows authenticated buy and sell mutations', async () => {
    const cookie = await getSessionCookie();

    const buy = await request(httpServer)
      .post('/markets/buy')
      .set('Cookie', cookie)
      .send({ symbol: 'AAPL', quantity: 2 });

    expect(buy.status).toBe(201);
    expect(Array.isArray(buy.body.positions)).toBe(true);
    expect(buy.body.history[0].side).toBe('BUY');

    const sell = await request(httpServer)
      .post('/markets/sell')
      .set('Cookie', cookie)
      .send({ symbol: 'AAPL', quantity: 1 });

    expect(sell.status).toBe(201);
    expect(sell.body.history[0].side).toBe('SELL');
  });

  it('keeps auth/session and authenticated buy aligned for a post-login browser flow', async () => {
    const cookie = await getSessionCookie();

    const session = await request(httpServer)
      .get('/auth/session')
      .set('Cookie', cookie);

    expect(session.status).toBe(200);
    expect(session.body.authenticated).toBe(true);
    expect(session.body.user).toEqual(expect.objectContaining({
      id: 'user-demo-1',
    }));

    const buy = await request(httpServer)
      .post('/markets/buy')
      .set('Cookie', cookie)
      .send({ symbol: 'MSFT', quantity: 1 });

    expect(buy.status).toBe(201);
    expect(buy.body.history[0].side).toBe('BUY');
    expect(buy.body.history[0].symbol).toBe('MSFT');
  });

  it('supports native-style auth by reusing the login token as a bearer credential', async () => {
    const login = await request(httpServer)
      .post('/auth/login')
      .send({ identifier: DEMO_IDENTIFIER, password: DEMO_PASSWORD });

    expect(login.status).toBe(201);
    expect(login.body.authenticated).toBe(true);
    expect(login.body.sessionToken).toEqual(expect.any(String));
    expect(login.body.expiresAt).toEqual(expect.any(Number));

    const session = await request(httpServer)
      .get('/auth/session')
      .set('Authorization', `Bearer ${login.body.sessionToken}`);

    expect(session.status).toBe(200);
    expect(session.body.authenticated).toBe(true);
    expect(session.body.user).toEqual(expect.objectContaining({
      id: 'user-demo-1',
    }));

    const summary = await request(httpServer)
      .get('/markets/summary')
      .set('Authorization', `Bearer ${login.body.sessionToken}`);

    expect(summary.status).toBe(200);
    expect(Array.isArray(summary.body.watchlist)).toBe(true);

    const logout = await request(httpServer)
      .post('/auth/logout')
      .set('Authorization', `Bearer ${login.body.sessionToken}`);

    expect(logout.status).toBe(201);

    const afterLogout = await request(httpServer)
      .get('/markets/summary')
      .set('Authorization', `Bearer ${login.body.sessionToken}`);

    expect(afterLogout.status).toBe(401);
    expect(afterLogout.body.message).toBe('Unauthorized');
  });

  it('rejects invalid session tokens for both trade and watchlist mutations', async () => {
    const watchlist = await request(httpServer)
      .post('/markets/watchlist')
      .set('X-Session-Token', 'invalid-session-token')
      .send({ symbol: 'NFLX' });

    expect(watchlist.status).toBe(401);
    expect(watchlist.body.message).toBe('Unauthorized');

    const buy = await request(httpServer)
      .post('/markets/buy')
      .set('Authorization', 'Bearer invalid-session-token')
      .send({ symbol: 'AAPL', quantity: 1 });

    expect(buy.status).toBe(401);
    expect(buy.body.message).toBe('Unauthorized');
  });

  it('invalidates session on logout', async () => {
    const cookie = await getSessionCookie();

    const logout = await request(httpServer)
      .post('/auth/logout')
      .set('Cookie', cookie);

    expect(logout.status).toBe(201);

    const afterLogout = await request(httpServer)
      .get('/markets/summary')
      .set('Cookie', cookie);

    expect(afterLogout.status).toBe(401);
    expect(afterLogout.body.message).toBe('Unauthorized');
  });

  it('rate limits repeated failed login attempts', async () => {
    const isolatedIdentifier = `${DEMO_IDENTIFIER}-rate-limit-isolation`;
    const responses = [];

    for (let index = 0; index < 5; index += 1) {
      const response = await request(httpServer)
        .post('/auth/login')
        .set('X-Forwarded-For', '203.0.113.10')
        .send({ identifier: isolatedIdentifier, password: 'wrong-password' });

      responses.push(response);
    }

    expect(responses.slice(0, 4).every((response) => response.status === 401)).toBe(true);
    expect(responses[4].status).toBe(429);
    expect(responses[4].body.message).toMatch(/Too many login attempts/i);
  });
});
