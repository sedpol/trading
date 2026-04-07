import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Server, Socket } from 'socket.io';
import { MarketsGateway } from './markets.gateway';
import { MarketsService } from './markets.service';
import { AuthService } from '../auth/auth.service';

type MockedSocket = Pick<Socket, 'id' | 'handshake' | 'disconnect' | 'emit'>;
const demoUsername = process.env.DEMO_AUTH_USERNAME ?? 'trader';
const demoEmail = process.env.DEMO_AUTH_EMAIL ?? 'trader@example.com';

describe('MarketsGateway', () => {
  let gateway: MarketsGateway;
  let marketsService: Pick<MarketsService, 'getSummary' | 'updateWatchlistPrices'>;
  let authService: Pick<AuthService, 'resolveSessionFromInput'>;

  beforeEach(() => {
    vi.useFakeTimers();

    marketsService = {
      getSummary: vi.fn().mockReturnValue({ watchlist: [], allMarkets: [] }),
      updateWatchlistPrices: vi.fn().mockReturnValue({ watchlist: [], allMarkets: [] }),
    };

    authService = {
      resolveSessionFromInput: vi.fn(),
    };

    gateway = new MarketsGateway(marketsService as MarketsService, authService as AuthService);

    const emit = vi.fn();
    const to = vi.fn().mockReturnValue({ emit });

    gateway.server = {
      to,
    } as unknown as Server;
  });

  afterEach(() => {
    gateway.onModuleDestroy();
    vi.useRealTimers();
  });

  it('accepts unauthenticated websocket clients and emits the public market summary', () => {
    vi.mocked(authService.resolveSessionFromInput).mockReturnValue(null);

    const disconnect = vi.fn();
    const emit = vi.fn();
    const client: MockedSocket = {
      id: 'socket-1',
      handshake: {
        headers: {},
        auth: {},
      },
      disconnect,
      emit,
    };

    expect(() => gateway.handleConnection(client as Socket)).not.toThrow();
    expect(disconnect).not.toHaveBeenCalled();
    expect(marketsService.getSummary).toHaveBeenCalledWith(undefined);
    expect(emit).toHaveBeenCalledWith(
      'market.update',
      expect.objectContaining({
        watchlist: [],
      }),
    );
  });

  it('accepts authenticated websocket clients and emits initial market update', () => {
    vi.mocked(authService.resolveSessionFromInput).mockReturnValue({
      token: 'session-token',
      expiresAt: Date.now() + 60_000,
      user: {
        id: 'user-demo-1',
        username: demoUsername,
        email: demoEmail,
      },
    });

    const disconnect = vi.fn();
    const emit = vi.fn();
    const client: MockedSocket = {
      id: 'socket-2',
      handshake: {
        headers: {},
        auth: {
          sessionToken: 'session-token',
        },
      },
      disconnect,
      emit,
    };

    gateway.handleConnection(client as Socket);

    expect(disconnect).not.toHaveBeenCalled();
    expect(marketsService.getSummary).toHaveBeenCalledWith('user-demo-1');
    expect(emit).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledWith(
      'market.update',
      expect.objectContaining({
        watchlist: [],
      }),
    );

    gateway.handleDisconnect(client as Socket);
  });
});
