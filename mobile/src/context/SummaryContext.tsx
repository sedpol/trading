import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ApiError } from '../api/client';
import { getSummary, submitTrade, toggleWatchlist } from '../api/markets';
import { SUMMARY_POLL_INTERVAL_MS } from '../config';
import { useAuth } from './AuthContext';
import type { ProtectedRouteName, Summary } from '../types';

type BannerState = {
  tone: 'error' | 'success' | 'info';
  text: string;
};

type SummaryContextValue = {
  banner: BannerState | null;
  clearBanner: () => void;
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdatedAt: number | null;
  refreshSummary: (silent?: boolean) => Promise<void>;
  summary: Summary | null;
  toggleSymbolWatchlist: (symbol: string, route: ProtectedRouteName) => Promise<void>;
  trade: (symbol: string, side: 'buy' | 'sell', quantity: number, route: ProtectedRouteName) => Promise<void>;
};

const SummaryContext = createContext<SummaryContextValue | undefined>(undefined);

const isUnauthorizedError = (error: unknown) => error instanceof ApiError && error.status === 401;

export function SummaryProvider({ children }: { children: ReactNode }) {
  const { requireReauth, session } = useAuth();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const summaryRef = useRef<Summary | null>(null);

  useEffect(() => {
    if (!banner || banner.tone !== 'success') {
      return;
    }

    const timer = setTimeout(() => {
      setBanner((current) => (current?.tone === 'success' ? null : current));
    }, 4000);

    return () => clearTimeout(timer);
  }, [banner]);

  useEffect(() => {
    summaryRef.current = summary;
  }, [summary]);

  const clearBanner = useCallback(() => {
    setBanner(null);
  }, []);

  const refreshSummary = useCallback(async (silent = false) => {
    if (!session?.token) {
      return;
    }

    if (!silent) {
      setIsLoading(summaryRef.current === null);
      setIsRefreshing(true);
    }

    try {
      const nextSummary = await getSummary(session.token);
      setSummary(nextSummary);
      setLastUpdatedAt(Date.now());
      setBanner((current) => (current?.tone === 'error' ? null : current));
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await requireReauth('Portfolio');
        return;
      }

      setBanner({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to refresh market data right now.',
      });
    } finally {
      setIsLoading(false);
      if (!silent) {
        setIsRefreshing(false);
      }
    }
  }, [requireReauth, session?.token]);

  useEffect(() => {
    void refreshSummary(true);

    const intervalId = setInterval(() => {
      void refreshSummary(true);
    }, SUMMARY_POLL_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [refreshSummary]);

  const toggleSymbolWatchlist = useCallback(async (symbol: string, route: ProtectedRouteName) => {
    if (!session?.token) {
      return;
    }

    try {
      const nextSummary = await toggleWatchlist(session.token, symbol);
      const isWatched = nextSummary.watchlist.some((item) => item.symbol === symbol);
      summaryRef.current = nextSummary;
      setSummary(nextSummary);
      setLastUpdatedAt(Date.now());
      setBanner({
        tone: 'success',
        text: isWatched ? `${symbol} added to your watchlist.` : `${symbol} removed from your watchlist.`,
      });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await requireReauth(route);
        return;
      }

      setBanner({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Unable to update watchlist.',
      });
    }
  }, [requireReauth, session?.token]);

  const trade = useCallback(async (
    symbol: string,
    side: 'buy' | 'sell',
    quantity: number,
    route: ProtectedRouteName,
  ) => {
    if (!session?.token) {
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      setBanner({ tone: 'error', text: 'Quantity must be a whole number greater than zero.' });
      return;
    }

    try {
      const nextSummary = await submitTrade(session.token, side, symbol, quantity);
      summaryRef.current = nextSummary;
      setSummary(nextSummary);
      setLastUpdatedAt(Date.now());
      setBanner({
        tone: 'success',
        text: `${side === 'buy' ? 'Bought' : 'Sold'} ${quantity} ${symbol} share(s).`,
      });
    } catch (error) {
      if (isUnauthorizedError(error)) {
        await requireReauth(route);
        return;
      }

      setBanner({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Trade failed.',
      });
    }
  }, [requireReauth, session?.token]);

  const value = useMemo<SummaryContextValue>(() => ({
    banner,
    clearBanner,
    isLoading,
    isRefreshing,
    lastUpdatedAt,
    refreshSummary,
    summary,
    toggleSymbolWatchlist,
    trade,
  }), [banner, clearBanner, isLoading, isRefreshing, lastUpdatedAt, refreshSummary, summary, toggleSymbolWatchlist, trade]);

  return <SummaryContext.Provider value={value}>{children}</SummaryContext.Provider>;
}

export function useSummary() {
  const context = useContext(SummaryContext);

  if (!context) {
    throw new Error('useSummary must be used inside SummaryProvider.');
  }

  return context;
}