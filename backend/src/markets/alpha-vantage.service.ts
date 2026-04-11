import { Injectable } from '@nestjs/common';

type QuoteResult = { price: number; change: number; startPrice: number };

@Injectable()
export class AlphaVantageService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://www.alphavantage.co/query';

  constructor() {
    const key = process.env.TRADING_API_KEY?.trim();

    if (!key) {
      throw new Error('TRADING_API_KEY is not set');
    }

    this.apiKey = key;
  }

  async fetchQuote(symbol: string): Promise<QuoteResult | null> {
    const url = new URL(this.baseUrl);
    url.search = new URLSearchParams({
      function: 'GLOBAL_QUOTE',
      symbol,
      apikey: this.apiKey,
    }).toString();

    let response: Response;
    try {
      response = await fetch(url);
    } catch {
      console.warn(`AlphaVantageService: network error fetching quote for ${symbol}`);
      return null;
    }

    if (!response.ok) {
      console.warn(`AlphaVantageService: non-2xx response (${response.status}) for ${symbol}`);
      return null;
    }

    let body: Record<string, unknown>;
    try {
      body = (await response.json()) as Record<string, unknown>;
    } catch {
      console.warn(`AlphaVantageService: failed to parse JSON for ${symbol}`);
      return null;
    }

    if ('Information' in body) {
      console.warn(`AlphaVantageService: rate limit hit for ${symbol}`);
      return null;
    }

    if ('Note' in body) {
      console.warn(`AlphaVantageService: API note returned for ${symbol}`);
      return null;
    }

    if ('Error Message' in body) {
      console.warn(`AlphaVantageService: invalid quote response for ${symbol}`);
      return null;
    }

    const quote = body['Global Quote'] as Record<string, string> | undefined;

    if (!quote || Object.keys(quote).length === 0) {
      console.warn(`AlphaVantageService: empty Global Quote for ${symbol}`);
      return null;
    }

    const price = parseFloat(quote['05. price']);
    const change = parseFloat(quote['09. change']);
    const startPrice = parseFloat(quote['08. previous close']);

    if (isNaN(price) || isNaN(change) || isNaN(startPrice)) {
      console.warn(`AlphaVantageService: NaN in parsed quote for ${symbol}`);
      return null;
    }

    return { price, change, startPrice };
  }
}
