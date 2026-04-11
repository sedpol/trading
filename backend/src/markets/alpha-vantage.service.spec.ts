import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AlphaVantageService } from './alpha-vantage.service';

const VALID_RESPONSE = {
  'Global Quote': {
    '01. symbol': 'AAPL',
    '05. price': '213.49',
    '08. previous close': '212.48',
    '09. change': '1.01',
    '10. change percent': '0.4753%',
  },
};

function makeFetchResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

describe('AlphaVantageService', () => {
  let service: AlphaVantageService;

  beforeEach(() => {
    process.env.TRADING_API_KEY = 'test-key';
    service = new AlphaVantageService();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.TRADING_API_KEY;
  });

  it('returns price, change, and startPrice on a successful GLOBAL_QUOTE response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(VALID_RESPONSE)));

    const result = await service.fetchQuote('AAPL');

    expect(result).toEqual({ price: 213.49, change: 1.01, startPrice: 212.48 });
  });

  it('returns null when the response body contains an "Information" (rate-limit) key', async () => {
    const rateLimitBody = {
      Information:
        'Thank you for using Alpha Vantage! Our standard API rate limit is 25 requests per day.',
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(rateLimitBody)));

    const result = await service.fetchQuote('AAPL');

    expect(result).toBeNull();
  });

  it('returns null on a non-2xx HTTP response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeFetchResponse({}, false, 429)),
    );

    const result = await service.fetchQuote('AAPL');

    expect(result).toBeNull();
  });

  it('returns null when fetch throws a network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network failure')));

    const result = await service.fetchQuote('AAPL');

    expect(result).toBeNull();
  });

  it('throws during construction when TRADING_API_KEY is not set', () => {
    delete process.env.TRADING_API_KEY;
    expect(() => new AlphaVantageService()).toThrowError('TRADING_API_KEY is not set');
  });

  it('returns null when Global Quote object is empty', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(makeFetchResponse({ 'Global Quote': {} })),
    );

    const result = await service.fetchQuote('AAPL');

    expect(result).toBeNull();
  });

  it('returns null when price fields are not parseable numbers', async () => {
    const badBody = {
      'Global Quote': {
        '05. price': 'N/A',
        '08. previous close': 'N/A',
        '09. change': 'N/A',
      },
    };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(makeFetchResponse(badBody)));

    const result = await service.fetchQuote('AAPL');

    expect(result).toBeNull();
  });

  it('returns null when Alpha Vantage responds with a Note body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        makeFetchResponse({
          Note: 'API call frequency is exceeded. Please retry later.',
        }),
      ),
    );

    const result = await service.fetchQuote('AAPL');

    expect(result).toBeNull();
  });
});
