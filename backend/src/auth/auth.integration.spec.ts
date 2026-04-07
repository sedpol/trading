import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../app.module';

describe('Auth + Markets integration', () => {
  let app: INestApplication;

  const getSessionCookie = async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ identifier: 'trader', password: 'trading123' });

    expect(login.status).toBe(201);
    const cookies = login.headers['set-cookie'];
    expect(cookies).toBeDefined();

    return cookies;
  };

  beforeEach(async () => {
    const testingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = testingModule.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('blocks unauthenticated markets summary reads', async () => {
    const response = await request(app.getHttpServer()).get('/markets/summary');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized');
  });

  it('blocks unauthenticated watchlist mutations', async () => {
    const response = await request(app.getHttpServer())
      .post('/markets/watchlist')
      .send({ symbol: 'NFLX' });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized');
  });

  it('blocks unauthenticated trade mutations', async () => {
    const buy = await request(app.getHttpServer())
      .post('/markets/buy')
      .send({ symbol: 'AAPL', quantity: 1 });

    expect(buy.status).toBe(401);
    expect(buy.body.message).toBe('Unauthorized');

    const sell = await request(app.getHttpServer())
      .post('/markets/sell')
      .send({ symbol: 'AAPL', quantity: 1 });

    expect(sell.status).toBe(401);
    expect(sell.body.message).toBe('Unauthorized');
  });

  it('allows authenticated watchlist reads and writes', async () => {
    const cookie = await getSessionCookie();

    const summary = await request(app.getHttpServer())
      .get('/markets/summary')
      .set('Cookie', cookie);

    expect(summary.status).toBe(200);
    expect(Array.isArray(summary.body.watchlist)).toBe(true);

    const toggle = await request(app.getHttpServer())
      .post('/markets/watchlist')
      .set('Cookie', cookie)
      .send({ symbol: 'NFLX' });

    expect(toggle.status).toBe(201);
    expect(toggle.body.watchlist.map((item: { symbol: string }) => item.symbol)).toContain('NFLX');
  });

  it('allows authenticated buy and sell mutations', async () => {
    const cookie = await getSessionCookie();

    const buy = await request(app.getHttpServer())
      .post('/markets/buy')
      .set('Cookie', cookie)
      .send({ symbol: 'AAPL', quantity: 2 });

    expect(buy.status).toBe(201);
    expect(Array.isArray(buy.body.positions)).toBe(true);
    expect(buy.body.history[0].side).toBe('BUY');

    const sell = await request(app.getHttpServer())
      .post('/markets/sell')
      .set('Cookie', cookie)
      .send({ symbol: 'AAPL', quantity: 1 });

    expect(sell.status).toBe(201);
    expect(sell.body.history[0].side).toBe('SELL');
  });

  it('keeps auth/session and authenticated buy aligned for a post-login browser flow', async () => {
    const cookie = await getSessionCookie();

    const session = await request(app.getHttpServer())
      .get('/auth/session')
      .set('Cookie', cookie);

    expect(session.status).toBe(200);
    expect(session.body.authenticated).toBe(true);
    expect(session.body.user).toEqual(expect.objectContaining({
      id: 'user-demo-1',
    }));

    const buy = await request(app.getHttpServer())
      .post('/markets/buy')
      .set('Cookie', cookie)
      .send({ symbol: 'MSFT', quantity: 1 });

    expect(buy.status).toBe(201);
    expect(buy.body.history[0].side).toBe('BUY');
    expect(buy.body.history[0].symbol).toBe('MSFT');
  });

  it('rejects invalid session tokens for both trade and watchlist mutations', async () => {
    const watchlist = await request(app.getHttpServer())
      .post('/markets/watchlist')
      .set('X-Session-Token', 'invalid-session-token')
      .send({ symbol: 'NFLX' });

    expect(watchlist.status).toBe(401);
    expect(watchlist.body.message).toBe('Unauthorized');

    const buy = await request(app.getHttpServer())
      .post('/markets/buy')
      .set('Authorization', 'Bearer invalid-session-token')
      .send({ symbol: 'AAPL', quantity: 1 });

    expect(buy.status).toBe(401);
    expect(buy.body.message).toBe('Unauthorized');
  });

  it('invalidates session on logout', async () => {
    const cookie = await getSessionCookie();

    const logout = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', cookie);

    expect(logout.status).toBe(201);

    const afterLogout = await request(app.getHttpServer())
      .get('/markets/summary')
      .set('Cookie', cookie);

    expect(afterLogout.status).toBe(401);
    expect(afterLogout.body.message).toBe('Unauthorized');
  });
});
