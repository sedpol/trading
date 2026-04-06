import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PortfolioPage } from './PortfolioPage';

type SocketEventHandler = (payload?: unknown) => void;

const socketHandlers = new Map<string, SocketEventHandler>();
const disconnectMock = vi.fn();

vi.mock('socket.io-client', () => ({
  io: () => ({
    on: vi.fn((event: string, handler: SocketEventHandler) => {
      socketHandlers.set(event, handler);
    }),
    disconnect: disconnectMock,
  }),
}));

const emitSocketEvent = (event: string, payload?: unknown) => {
  socketHandlers.get(event)?.(payload);
};

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
    socketHandlers.clear();
    disconnectMock.mockClear();

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

  it('renders an icon-only back link with an accessible label and landing destination', async () => {
    render(
      <MemoryRouter>
        <PortfolioPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('GOOG')).toBeInTheDocument();
    });

    expect(screen.queryByText('Back to Landing')).not.toBeInTheDocument();

    const backLink = screen.getByRole('link', { name: 'Back to Landing' });
    const portfolioLabel = screen.getByText('My Portfolio');

    expect(backLink).toHaveAttribute('href', '/');
    expect(backLink.querySelector('svg.portfolio-back-icon')).toBeInTheDocument();
    expect(backLink.nextElementSibling).toBe(portfolioLabel);
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

    const connectionStatus = screen.getByRole('status', {
      name: 'Connection status: disconnected',
    });

    expect(connectionStatus.querySelector('.connection-status-dot-disconnected')).toBeInTheDocument();

    const heldToggle = screen.getByRole('button', { name: 'Remove from watchlist AAPL' });
    const regularToggle = screen.getByRole('button', { name: 'Remove from watchlist GOOG' });

    expect(heldToggle).toBeDisabled();
    expect(regularToggle).toBeEnabled();
  });

  it('toggles non-held watchlist symbols through the backend flow', async () => {
    const updatedSummary = {
      ...mockSummary,
      watchlist: [mockSummary.watchlist[0]],
    };

    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockSummary,
      } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => updatedSummary,
      } as Response);

    vi.stubGlobal('fetch', fetchMock);

    render(
      <MemoryRouter>
        <PortfolioPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Remove from watchlist GOOG' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Remove from watchlist GOOG' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      'http://localhost:3000/markets/watchlist',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ symbol: 'GOOG' }),
      }),
    );

    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Remove from watchlist GOOG' })).not.toBeInTheDocument();
    });
  });

  it('updates the status dot color based on websocket connection events', async () => {
    render(
      <MemoryRouter>
        <PortfolioPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('GOOG')).toBeInTheDocument();
    });

    act(() => {
      emitSocketEvent('connect');
    });

    await waitFor(() => {
      const connectedStatus = screen.getByRole('status', {
        name: 'Connection status: connected',
      });
      expect(connectedStatus.querySelector('.connection-status-dot-connected')).toBeInTheDocument();
    });

    expect(screen.queryByText('Live prices connected')).not.toBeInTheDocument();

    act(() => {
      emitSocketEvent('disconnect');
    });

    await waitFor(() => {
      const disconnectedStatus = screen.getByRole('status', {
        name: 'Connection status: disconnected',
      });
      expect(disconnectedStatus.querySelector('.connection-status-dot-disconnected')).toBeInTheDocument();
    });
  });
});
