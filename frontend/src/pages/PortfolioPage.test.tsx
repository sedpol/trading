import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PortfolioPage } from './PortfolioPage';

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
    {
      symbol: 'GOOG',
      companyName: 'Alphabet Inc.',
      startPrice: 176.91,
      price: 176.91,
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
    {
      symbol: 'GOOG',
      companyName: 'Alphabet Inc.',
      startPrice: 176.91,
      price: 176.91,
      change: 0,
    },
    {
      symbol: 'TSLA',
      companyName: 'Tesla, Inc.',
      startPrice: 171.22,
      price: 171.22,
      change: 0,
    },
  ],
  positions: [
    {
      symbol: 'AAPL',
      quantity: 2,
      averagePrice: 200,
      lots: [{ quantity: 2, boughtPrice: 200 }],
    },
  ],
  history: [],
};

describe('PortfolioPage', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        ({
          ok: true,
          json: async () => mockSummary,
        }) as Response,
      ),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses backend-owned watchlist and keeps held shares in watchlist automatically', async () => {
    const { container } = render(
      <MemoryRouter>
        <PortfolioPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('GOOG')).toBeInTheDocument();
    });

    const watchlistSymbols = Array.from(
      container.querySelectorAll('.watchlist-row .watchlist-main > span:first-child'),
    ).map((node) => node.textContent);

    expect(watchlistSymbols).toEqual(['AAPL', 'GOOG']);
    expect(watchlistSymbols).not.toContain('TSLA');
    expect(screen.getByRole('status')).toHaveTextContent('Connecting...');
  });
});
