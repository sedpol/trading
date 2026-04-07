import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AUTH_STORAGE_KEY } from './auth/constants';

vi.mock('socket.io-client', () => ({
  io: () => ({
    on: vi.fn(),
    disconnect: vi.fn(),
  }),
}));

const mockSummary = {
  balance: 20000,
  cashBalance: 20000,
  dailyPnl: 0,
  watchlist: [
    {
      symbol: 'AAPL',
      companyName: 'Apple Inc.',
      startPrice: 212.48,
      price: 212.48,
      change: 0,
    },
  ],
  allMarkets: [
    {
      symbol: 'AAPL',
      companyName: 'Apple Inc.',
      startPrice: 212.48,
      price: 212.48,
      change: 0,
    },
  ],
  positions: [],
  history: [],
};

describe('App', () => {
  beforeEach(() => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);

    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo) => {
      if (typeof input === 'string' && input.endsWith('/auth/session')) {
        return {
          ok: false,
          status: 401,
        } as Response;
      }

      if (typeof input === 'string' && input.endsWith('/auth/login')) {
        return {
          ok: true,
          json: async () => ({ user: { identifier: 'demo-user' } }),
        } as Response;
      }

      if (typeof input === 'string' && input.endsWith('/markets/summary')) {
        return {
          ok: true,
          json: async () => mockSummary,
        } as Response;
      }

      return {
        ok: true,
        json: async () => mockSummary,
      } as Response;
    }));
  });

  afterEach(() => {
    window.history.replaceState({}, '', '/');
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    vi.restoreAllMocks();
  });

  it('redirects guests to login when they open a protected watchlist route', async () => {
    window.history.replaceState({}, '', '/portfolio');

    const { default: App } = await import('./App');

    render(<App />);

    expect(await screen.findByRole('heading', { name: /Sign in to view your watchlist/i })).toBeInTheDocument();
    expect(screen.queryByText('AAPL')).not.toBeInTheDocument();
  });

  it('logs in and returns to the original protected route with watchlist data visible', async () => {
    window.history.replaceState({}, '', '/portfolio');

    let sessionChecks = 0;
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo) => {
      if (typeof input === 'string' && input.endsWith('/auth/session')) {
        sessionChecks += 1;

        if (sessionChecks === 1) {
          return {
            ok: false,
            status: 401,
          } as Response;
        }

        return {
          ok: true,
          json: async () => ({ user: { identifier: 'demo-user' } }),
        } as Response;
      }

      if (typeof input === 'string' && input.endsWith('/auth/login')) {
        return {
          ok: true,
          json: async () => ({ user: { identifier: 'demo-user' } }),
        } as Response;
      }

      if (typeof input === 'string' && input.endsWith('/markets/summary')) {
        return {
          ok: true,
          json: async () => mockSummary,
        } as Response;
      }

      return {
        ok: true,
        json: async () => mockSummary,
      } as Response;
    }));

    const { default: App } = await import('./App');

    render(<App />);

    expect(await screen.findByRole('heading', { name: /Sign in to view your watchlist/i })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Email or username/i), {
      target: { value: 'demo-user' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'trading-pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/My Portfolio/i)).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });
  });

  it('renders landing by default and routes guests to login from the portfolio CTA', async () => {
    const { default: App } = await import('./App');

    render(<App />);

    expect(screen.getByText(/Built for Active Traders/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: /Sign in to access watchlist/i }));

    expect(await screen.findByRole('heading', { name: /Sign in to view your watchlist/i })).toBeInTheDocument();
  });

  it('resets stale local auth during bootstrap when server session is missing', async () => {
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ identifier: 'stale-user' }));
    window.history.replaceState({}, '', '/portfolio');

    const { default: App } = await import('./App');

    render(<App />);

    expect(await screen.findByRole('heading', { name: /Sign in to view your watchlist/i })).toBeInTheDocument();
    expect(window.localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });
});
