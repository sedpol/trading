import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import App from '../App';
import { ApiError } from './api/client';
import type { AuthSessionRecord, Summary } from './types';

jest.mock('./storage/authStorage', () => ({
  persistSession: jest.fn(),
  readStoredSession: jest.fn(),
}));

jest.mock('./api/auth', () => ({
  loginRequest: jest.fn(),
  logoutRequest: jest.fn(),
  validateSession: jest.fn(),
}));

jest.mock('./api/markets', () => ({
  getSummary: jest.fn(),
  submitTrade: jest.fn(),
  toggleWatchlist: jest.fn(),
}));

const authStorage = jest.requireMock('./storage/authStorage') as {
  persistSession: jest.Mock;
  readStoredSession: jest.Mock;
};

const authApi = jest.requireMock('./api/auth') as {
  loginRequest: jest.Mock;
  logoutRequest: jest.Mock;
  validateSession: jest.Mock;
};

const marketsApi = jest.requireMock('./api/markets') as {
  getSummary: jest.Mock;
  submitTrade: jest.Mock;
  toggleWatchlist: jest.Mock;
};

let shouldResetFakeTimers = false;

const baseSession: AuthSessionRecord = {
  token: 'token-123',
  identifier: 'trader',
  expiresAt: 1760000000000,
};

const authenticatedUser = {
  id: 'user-1',
  username: 'trader',
  email: 'trader@example.com',
  identifier: 'trader',
};

const baseSummary: Summary = {
  balance: 25120.44,
  cashBalance: 8200.22,
  dailyPnl: 312.1,
  watchlist: [
    {
      symbol: 'AAPL',
      companyName: 'Apple Inc.',
      startPrice: 187.22,
      price: 191.35,
      change: 0.022,
    },
  ],
  allMarkets: [
    {
      symbol: 'AAPL',
      companyName: 'Apple Inc.',
      startPrice: 187.22,
      price: 191.35,
      change: 0.022,
    },
    {
      symbol: 'MSFT',
      companyName: 'Microsoft Corporation',
      startPrice: 412.5,
      price: 418.14,
      change: 0.0136,
    },
  ],
  positions: [
    {
      symbol: 'AAPL',
      companyName: 'Apple Inc.',
      quantity: 3,
      averagePrice: 180,
      lots: [
        {
          quantity: 3,
          boughtPrice: 180,
        },
      ],
    },
  ],
  history: [
    {
      id: 'trade-1',
      symbol: 'AAPL',
      side: 'BUY',
      quantity: 3,
      price: 180,
      grossTotal: 540,
      commission: 0,
      netTotal: 540,
      timestamp: '2026-04-10T09:30:00.000Z',
    },
  ],
};

function cloneSummary(summary: Summary = baseSummary): Summary {
  return JSON.parse(JSON.stringify(summary)) as Summary;
}

async function renderApp() {
  const result = render(<App />);
  await act(async () => {
    await Promise.resolve();
  });
  return result;
}

beforeEach(() => {
  jest.clearAllMocks();
  authStorage.readStoredSession.mockResolvedValue(null);
  authStorage.persistSession.mockResolvedValue(undefined);
  authApi.validateSession.mockResolvedValue({ state: 'unauthenticated' });
  authApi.loginRequest.mockResolvedValue({ ok: false, message: 'Invalid credentials. Please try again.' });
  authApi.logoutRequest.mockResolvedValue(undefined);
  marketsApi.getSummary.mockResolvedValue(cloneSummary());
  marketsApi.submitTrade.mockResolvedValue(cloneSummary());
  marketsApi.toggleWatchlist.mockImplementation(async (_token: string, symbol: string) => {
    const nextSummary = cloneSummary();
    const existing = nextSummary.watchlist.some((item) => item.symbol === symbol);

    nextSummary.watchlist = existing
      ? nextSummary.watchlist.filter((item) => item.symbol !== symbol)
      : nextSummary.watchlist.concat(nextSummary.allMarkets.find((item) => item.symbol === symbol) ?? []);

    return nextSummary;
  });
});

describe('mobile app journeys', () => {
  afterEach(() => {
    if (shouldResetFakeTimers) {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
      shouldResetFakeTimers = false;
    }
  });

  it('renders the logged-out flow when no stored session exists', async () => {
    await renderApp();

    expect(await screen.findByText('Trade confidently from a phone-first workflow.')).toBeTruthy();
    expect(screen.getByText('Sign in to access portfolio')).toBeTruthy();
    expect(screen.queryByText('Markets and watchlist')).toBeNull();
  });

  it('switches from login into protected navigation after successful auth', async () => {
    authApi.loginRequest.mockResolvedValue({
      ok: true,
      session: baseSession,
      user: authenticatedUser,
    });

    await renderApp();

    fireEvent.press(await screen.findByText('Sign in to access portfolio'));

    expect(await screen.findByText('Sign in to continue.')).toBeTruthy();

    fireEvent.changeText(screen.getByPlaceholderText('trader'), 'trader');
    fireEvent.changeText(screen.getByPlaceholderText('Enter your password'), 'hunter2');
    fireEvent.press(screen.getByText('Sign in'));

    expect(await screen.findByText('Portfolio and history')).toBeTruthy();
    expect(await screen.findByText('Signed in as trader')).toBeTruthy();
    expect(authStorage.persistSession).toHaveBeenCalledWith(baseSession);
  });

  it('bootstraps an authenticated user into markets and portfolio surfaces', async () => {
    authStorage.readStoredSession.mockResolvedValue(baseSession);
    authApi.validateSession.mockResolvedValue({
      state: 'authenticated',
      session: baseSession,
      user: authenticatedUser,
    });

    await renderApp();

    expect(await screen.findByText('Markets and watchlist')).toBeTruthy();
    expect(await screen.findByText('Your Watchlist')).toBeTruthy();
    expect(await screen.findByText('All Markets')).toBeTruthy();
    expect(await screen.findByText('MSFT')).toBeTruthy();

    fireEvent.press(screen.getByText('Portfolio'));

    expect(await screen.findByText('Portfolio and history')).toBeTruthy();
    expect(await screen.findByText('Holdings P&L')).toBeTruthy();
    expect(await screen.findByText('Buy Lots')).toBeTruthy();
  });

  it('falls back to the public shell when bootstrap session is unauthorized', async () => {
    authStorage.readStoredSession.mockResolvedValue(baseSession);
    authApi.validateSession.mockResolvedValue({ state: 'unauthenticated' });

    await renderApp();

    expect(await screen.findByText('Trade confidently from a phone-first workflow.')).toBeTruthy();
    expect(authStorage.persistSession).toHaveBeenCalledWith(null);
    expect(screen.queryByText('Portfolio and history')).toBeNull();
  });

  it('clears protected state on logout', async () => {
    authStorage.readStoredSession.mockResolvedValue(baseSession);
    authApi.validateSession.mockResolvedValue({
      state: 'authenticated',
      session: baseSession,
      user: authenticatedUser,
    });

    await renderApp();

    fireEvent.press(await screen.findByText('Portfolio'));
    fireEvent.press(await screen.findByText('Log out'));

    expect(await screen.findByText('Trade confidently from a phone-first workflow.')).toBeTruthy();
    expect(authApi.logoutRequest).toHaveBeenCalledWith(baseSession.token);
    expect(authStorage.persistSession).toHaveBeenCalledWith(null);
  });

  it('updates watchlist state from the markets screen', async () => {
    authStorage.readStoredSession.mockResolvedValue(baseSession);
    authApi.validateSession.mockResolvedValue({
      state: 'authenticated',
      session: baseSession,
      user: authenticatedUser,
    });

    const initialSummary = cloneSummary();
    initialSummary.watchlist = [];
    marketsApi.getSummary.mockResolvedValue(initialSummary);
    const toggledSummary = cloneSummary(initialSummary);
    toggledSummary.watchlist = [
      toggledSummary.allMarkets.find((item) => item.symbol === 'MSFT')!,
    ];
    marketsApi.toggleWatchlist.mockResolvedValue(toggledSummary);

    await renderApp();

    expect(await screen.findByText('No watched symbols yet. Add markets below to build your list.')).toBeTruthy();

    const watchButtons = await screen.findAllByText('Watch');
    fireEvent.press(watchButtons[0]);

    await waitFor(() => {
      expect(marketsApi.toggleWatchlist).toHaveBeenCalledWith(baseSession.token, 'MSFT');
    });

    expect(await screen.findByText('MSFT added to your watchlist.')).toBeTruthy();
  });

  it('submits a buy trade from the markets screen and shows success feedback', async () => {
    authStorage.readStoredSession.mockResolvedValue(baseSession);
    authApi.validateSession.mockResolvedValue({
      state: 'authenticated',
      session: baseSession,
      user: authenticatedUser,
    });

    const tradedSummary = cloneSummary();
    tradedSummary.positions = tradedSummary.positions.concat({
      symbol: 'MSFT',
      companyName: 'Microsoft Corporation',
      quantity: 2,
      averagePrice: 418.14,
      lots: [
        {
          quantity: 2,
          boughtPrice: 418.14,
        },
      ],
    });
    tradedSummary.history = [
      {
        id: 'trade-2',
        symbol: 'MSFT',
        side: 'BUY',
        quantity: 2,
        price: 418.14,
        grossTotal: 836.28,
        commission: 0,
        netTotal: 836.28,
        timestamp: '2026-04-10T10:00:00.000Z',
      },
      ...tradedSummary.history,
    ];
    marketsApi.submitTrade.mockResolvedValue(tradedSummary);

    await renderApp();

    expect(await screen.findByText('Markets and watchlist')).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText('Trade quantity for MSFT'), '2');
    fireEvent(screen.getByLabelText('Trade quantity for MSFT'), 'blur');
    fireEvent.press(screen.getByLabelText('Buy MSFT'));

    await waitFor(() => {
      expect(marketsApi.submitTrade).toHaveBeenCalledWith(baseSession.token, 'buy', 'MSFT', 2);
    });

    expect(await screen.findByText('Bought 2 MSFT share(s).')).toBeTruthy();
  });

  it('shows rejected sell feedback from the portfolio screen without a false success state', async () => {
    authStorage.readStoredSession.mockResolvedValue(baseSession);
    authApi.validateSession.mockResolvedValue({
      state: 'authenticated',
      session: baseSession,
      user: authenticatedUser,
    });
    marketsApi.submitTrade.mockRejectedValueOnce(new Error('Insufficient shares to sell.'));

    await renderApp();

    fireEvent.press(await screen.findByText('Portfolio'));
    expect(await screen.findByText('Portfolio and history')).toBeTruthy();

    fireEvent.changeText(screen.getByLabelText('Trade quantity for AAPL'), '5');
    fireEvent(screen.getByLabelText('Trade quantity for AAPL'), 'blur');
    fireEvent.press(screen.getByLabelText('Sell AAPL'));

    await waitFor(() => {
      expect(marketsApi.submitTrade).toHaveBeenCalledWith(baseSession.token, 'sell', 'AAPL', 5);
    });

    expect(await screen.findByText('Insufficient shares to sell.')).toBeTruthy();
    expect(screen.queryByText('Sold 5 AAPL share(s).')).toBeNull();
  });

  it('requires re-authentication when protected summary refresh becomes unauthorized', async () => {
    authStorage.readStoredSession.mockResolvedValue(baseSession);
    authApi.validateSession.mockResolvedValue({
      state: 'authenticated',
      session: baseSession,
      user: authenticatedUser,
    });
    marketsApi.getSummary.mockRejectedValue(new ApiError('Unauthorized', 401));

    await renderApp();

    expect(await screen.findByText('Sign in to continue.')).toBeTruthy();
    expect(await screen.findByText('Your session expired. Please sign in again to continue.')).toBeTruthy();
    expect(authStorage.persistSession).toHaveBeenCalledWith(null);
  });

  it('keeps background auto-refresh silent while continuing to poll', async () => {
    jest.useFakeTimers();
    shouldResetFakeTimers = true;
    authStorage.readStoredSession.mockResolvedValue(baseSession);
    authApi.validateSession.mockResolvedValue({
      state: 'authenticated',
      session: baseSession,
      user: authenticatedUser,
    });

    const app = await renderApp();

    expect(await screen.findByText('Markets and watchlist')).toBeTruthy();
    expect(screen.getByText('Auto-refresh every 5s')).toBeTruthy();
    expect(screen.queryByText('Refreshing...')).toBeNull();
    expect(marketsApi.getSummary).toHaveBeenCalledTimes(1);

    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(marketsApi.getSummary).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByText('Auto-refresh every 5s')).toBeTruthy();
    expect(screen.queryByText('Refreshing...')).toBeNull();

    app.unmount();
  });
});