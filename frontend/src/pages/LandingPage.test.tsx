import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LandingPage } from './LandingPage';

const baseSummary = {
  balance: 20000,
  cashBalance: 20000,
  dailyPnl: 0,
  watchlist: [
    {
      symbol: 'AAPL',
      companyName: 'Apple Inc.',
      startPrice: 212.48,
      price: 212.48,
      change: 1.23,
    },
    {
      symbol: 'GOOG',
      companyName: 'Alphabet Inc.',
      startPrice: 176.91,
      price: 176.91,
      change: -0.45,
    },
    {
      symbol: 'MSFT',
      companyName: 'Microsoft Corporation',
      startPrice: 343.12,
      price: 343.12,
      change: 0.12,
    },
    {
      symbol: 'NVDA',
      companyName: 'NVIDIA Corporation',
      startPrice: 942.65,
      price: 942.65,
      change: 0.98,
    },
    {
      symbol: 'AMZN',
      companyName: 'Amazon.com, Inc.',
      startPrice: 176.90,
      price: 176.90,
      change: -0.31,
    },
  ],
  allMarkets: [
    {
      symbol: 'AAPL',
      companyName: 'Apple Inc.',
      startPrice: 212.48,
      price: 212.48,
      change: 1.23,
    },
    {
      symbol: 'GOOG',
      companyName: 'Alphabet Inc.',
      startPrice: 176.91,
      price: 176.91,
      change: -0.45,
    },
    {
      symbol: 'MSFT',
      companyName: 'Microsoft Corporation',
      startPrice: 343.12,
      price: 343.12,
      change: 0.12,
    },
    {
      symbol: 'NVDA',
      companyName: 'NVIDIA Corporation',
      startPrice: 942.65,
      price: 942.65,
      change: 0.98,
    },
    {
      symbol: 'AMZN',
      companyName: 'Amazon.com, Inc.',
      startPrice: 176.90,
      price: 176.90,
      change: -0.31,
    },
    {
      symbol: 'TSLA',
      companyName: 'Tesla, Inc.',
      startPrice: 171.22,
      price: 171.22,
      change: 0.44,
    },
  ],
  positions: [
    {
      symbol: 'AAPL',
      quantity: 3,
      averagePrice: 200,
      lots: [{ quantity: 3, boughtPrice: 200 }],
    },
  ],
  history: [],
};

describe('LandingPage', () => {
  beforeEach(() => {
    let currentSummary = structuredClone(baseSummary);

    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo, init?: RequestInit) => {
        if (typeof input === 'string' && input.endsWith('/markets/watchlist')) {
          const body = JSON.parse(init?.body as string) as { symbol: string };
          const existing = currentSummary.watchlist.some((item) => item.symbol === body.symbol);

          currentSummary = {
            ...currentSummary,
            watchlist: existing
              ? currentSummary.watchlist.filter((item) => item.symbol !== body.symbol)
              : [...currentSummary.watchlist, currentSummary.allMarkets.find((item) => item.symbol === body.symbol)!],
          };
        }

        if (typeof input === 'string' && input.endsWith('/markets/buy')) {
          const body = JSON.parse(init?.body as string) as { symbol: string; quantity: number };

          if (body.symbol === 'TSLA' && body.quantity === 999) {
            return {
              ok: false,
              json: async () => ({
                message: 'Not enough cash to complete this buy order.',
              }),
            } as Response;
          }

          const position = currentSummary.positions.find((item) => item.symbol === body.symbol);

          currentSummary = {
            ...currentSummary,
            watchlist: currentSummary.watchlist.some((item) => item.symbol === body.symbol)
              ? currentSummary.watchlist
              : [...currentSummary.watchlist, currentSummary.allMarkets.find((item) => item.symbol === body.symbol)!],
            positions: position
              ? currentSummary.positions.map((item) =>
                  item.symbol === body.symbol
                    ? { ...item, quantity: item.quantity + body.quantity }
                    : item,
                )
              : [
                  ...currentSummary.positions,
                  {
                    symbol: body.symbol,
                    quantity: body.quantity,
                    averagePrice: currentSummary.allMarkets.find((item) => item.symbol === body.symbol)!.price,
                    lots: [
                      {
                        quantity: body.quantity,
                        boughtPrice: currentSummary.allMarkets.find((item) => item.symbol === body.symbol)!.price,
                      },
                    ],
                  },
                ],
          };
        }

        return {
          ok: true,
          json: async () => currentSummary,
        } as Response;
      }),
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows all markets and auto-adds held symbols to watchlist', async () => {
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('All Markets')).toBeInTheDocument();
    });

    expect(screen.getByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByText('Alphabet Inc.')).toBeInTheDocument();
    expect(screen.getByText('Tesla, Inc.')).toBeInTheDocument();

    const heldButton = screen.getByRole('button', { name: /Remove from watchlist AAPL/i });
    expect(heldButton).toBeDisabled();
    expect(heldButton).toHaveAttribute('title', 'Bought shares cannot be removed from watchlist.');

    await waitFor(() => {
      expect(screen.getByText('Showing 5 symbols.')).toBeInTheDocument();
    });
    const chips = Array.from(container.querySelectorAll('.landing-watchlist-chip')).map(
      (node) => node.textContent,
    );
    expect(chips).toEqual(['AAPL', 'AMZN', 'GOOG', 'MSFT', 'NVDA']);
  });

  it('allows heart toggling to move a symbol into watchlist', async () => {
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Tesla, Inc.')).toBeInTheDocument();
    });

    const watchlistButton = screen.getByRole('button', { name: /Add to watchlist TSLA/i });
    fireEvent.click(watchlistButton);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Remove from watchlist TSLA/i })).toHaveTextContent('♥');
    });
    expect(screen.getByText('Showing 6 symbols.')).toBeInTheDocument();
    const chips = Array.from(container.querySelectorAll('.landing-watchlist-chip')).map(
      (node) => node.textContent,
    );
    expect(chips).toContain('TSLA');
  });

  it('sorts all markets by price and toggles direction', async () => {
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Tesla, Inc.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Price/i }));

    const ascending = Array.from(container.querySelectorAll('.landing-market-row:not(.landing-market-header)'))
      .map((row) => row.querySelectorAll('span')[0]?.textContent);
    expect(ascending).toEqual(['TSLA', 'AMZN', 'GOOG', 'AAPL', 'MSFT', 'NVDA']);

    fireEvent.click(screen.getByRole('button', { name: /Price/i }));

    const descending = Array.from(container.querySelectorAll('.landing-market-row:not(.landing-market-header)'))
      .map((row) => row.querySelectorAll('span')[0]?.textContent);
    expect(descending).toEqual(['NVDA', 'MSFT', 'AAPL', 'GOOG', 'AMZN', 'TSLA']);
  });

  it('expands a market row and shows buy sell controls', async () => {
    const { container } = render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Tesla, Inc.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Expand TSLA/i }));

    expect(container.querySelector('.landing-markets-table-scroll')).not.toBeNull();
    expect(container.querySelector('.landing-market-expanded-panel')).not.toBeNull();

    expect(screen.getByRole('spinbutton', { name: /Quantity for TSLA/i })).toHaveValue(1);
    expect(screen.getByRole('button', { name: /^Buy$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Sell$/i })).toBeInTheDocument();

    fireEvent.change(screen.getByRole('spinbutton', { name: /Quantity for TSLA/i }), {
      target: { value: '2' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Buy$/i }));

    await waitFor(() => {
      expect(screen.getByText('Bought 2 TSLA share(s).')).toBeInTheDocument();
    });
  });

  it('shows the portfolio-style error banner and keeps the market list visible after a failed trade', async () => {
    render(
      <MemoryRouter>
        <LandingPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Tesla, Inc.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Expand TSLA/i }));
    fireEvent.change(screen.getByRole('spinbutton', { name: /Quantity for TSLA/i }), {
      target: { value: '999' },
    });
    fireEvent.click(screen.getByRole('button', { name: /^Buy$/i }));

    await waitFor(() => {
      expect(screen.getByText('Error: Not enough cash to complete this buy order.')).toBeInTheDocument();
    });

    expect(screen.getByRole('table', { name: 'All markets' })).toBeInTheDocument();
    expect(screen.getByText('Tesla, Inc.')).toBeInTheDocument();
  });
});
