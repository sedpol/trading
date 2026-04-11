import { apiRequest } from './client';
import type { Summary } from '../types';

export const getSummary = (token: string) => apiRequest<Summary>('/markets/summary', { token });

export const toggleWatchlist = (token: string, symbol: string) => apiRequest<Summary>('/markets/watchlist', {
  body: { symbol },
  method: 'POST',
  token,
});

export const submitTrade = (
  token: string,
  side: 'buy' | 'sell',
  symbol: string,
  quantity: number,
) => apiRequest<Summary>(`/markets/${side}`, {
  body: { quantity, symbol },
  method: 'POST',
  token,
});