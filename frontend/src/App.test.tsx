import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo) => {
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
    vi.restoreAllMocks();
  });

  it('renders landing by default and opens portfolio dashboard from CTA', async () => {
    const { default: App } = await import('./App');

    render(<App />);

    expect(screen.getByText(/Built for Active Traders/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: /Go to My Portfolio/i }));

    expect(screen.getByText(/My Portfolio/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('AAPL')).toBeInTheDocument();
    });

    expect(screen.queryByText('Apple Inc.')).toBeNull();
  });
});
