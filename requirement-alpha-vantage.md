# Requirements: Alpha Vantage Market Data Integration

## Feature 1: Real-Time Stock Price Data via Alpha Vantage Free Tier
Date: 2026-04-08
Feature Number: 1
Status: Done
Owner: product-manager

#### 1. Problem Statement
- MarketsService currently serves hardcoded static prices for all 20 symbols, so price, change, and startPrice values never reflect real market conditions. Traders cannot make informed decisions from stale data, reducing platform credibility and usefulness during market hours.

#### 2. Goals and Success Metrics
- Goal(s):
  - Replace static prices with real last-trade prices from Alpha Vantage GLOBAL_QUOTE.
  - Refresh prices continuously during app lifetime within free-tier rate limits.
  - Maintain zero-downtime degradation when the external API is unavailable.
- KPI(s):
  - 100% of the 20 watched symbols return a non-zero, real-world price within 30 s of app startup.
  - Zero frontend-visible errors caused by Alpha Vantage rate-limiting or outages.
  - Daily API call budget stays at or below 480 calls/day (20 symbols × ≤24 refresh cycles/day) — well within the 500/day free limit.

#### 3. Research Summary
- Reference products/sites reviewed: Alpha Vantage API documentation (alphavantage.co/documentation), NestJS HTTP patterns, eToro and Robinhood price-refresh UX.
- Key findings:
  - GLOBAL_QUOTE endpoint returns fields `05. price`, `09. change`, `10. change percent`, and `08. previous close` per symbol in a single call.
  - Free tier: 25 requests/minute, 500 requests/day. Fetching 20 symbols at 1 req/s takes 20 s and costs 20 calls per cycle; a 60-second refresh interval uses 480 calls/day.
  - Sequential fetch with a 1-second gap between symbols stays comfortably under 25 req/min.
  - Alpha Vantage returns a JSON `{"Information": "..."}` body (not an HTTP error code) when the rate limit is hit; the service must detect this pattern.
  - No authentication beyond the API key query parameter is required.
  - The existing WatchlistItem summary response shape (`price`, `change`, `startPrice`) is already compatible with GLOBAL_QUOTE output fields without frontend changes.
- Assumptions:
  - `TRADING_API_KEY` is already present in `backend/.env` and is a valid Alpha Vantage key.
  - Node 18+ built-in `fetch` is available in the NestJS runtime (no additional HTTP packages required).
  - The app runs continuously; price data is held in memory and not persisted.
  - "Previous close" is a suitable proxy for `startPrice`; intraday `change` maps to absolute price change.
  - During non-market hours Alpha Vantage still returns the last known price, which is acceptable.

#### 4. Scope
- In scope:
  - New `AlphaVantageService` that wraps GLOBAL_QUOTE HTTP calls using Node built-in `fetch`.
  - `MarketsService` updated to call `AlphaVantageService` on startup and on a 60-second periodic interval.
  - Graceful degradation: if a fetch fails or returns a rate-limit/error body, cached price is retained.
  - Mapping of GLOBAL_QUOTE response fields to `price`, `startPrice`, and `change` on `WatchlistItem`.
  - Safe environment variable access pattern (throw on missing key at startup, not at request time).
  - Unit tests for `AlphaVantageService` mocking `global.fetch`; integration smoke test for `MarketsService` price population.
- Out of scope:
  - Any frontend changes (response shape is already compatible).
  - Database or persistent price storage.
  - WebSocket push of individual price ticks (existing gateway continues to broadcast cached prices on its current schedule).
  - Support for additional Alpha Vantage endpoints (TIME_SERIES, OVERVIEW, etc.).
  - Paid-tier features or higher-frequency refresh.
  - Circuit-breaker retry logic beyond simple cache-retention degradation.

#### 5. Prioritized Requirements
- P0:
  - `AlphaVantageService` must fetch GLOBAL_QUOTE for a given symbol using Node built-in `fetch` and return `{ price, change, startPrice }`.
  - `MarketsService` must call `AlphaVantageService` for all 20 symbols on module initialization (`onModuleInit`), sequentially with a ~1 s delay between calls.
  - `MarketsService` must schedule a recurring refresh every 60 seconds using `setInterval` (or NestJS `@Interval`).
  - If `AlphaVantageService` returns an error (network failure, non-OK HTTP status, or `"Information"` key present in response body), `MarketsService` must retain the previously cached price for that symbol without throwing.
  - `TRADING_API_KEY` must be read once at service construction time; if absent, the app must fail fast with a clear error rather than making unauthenticated requests.
  - `price` on `WatchlistItem` = `"05. price"` (parsed float).
  - `startPrice` = `"08. previous close"` (parsed float).
  - `change` = `"09. change"` (parsed float, absolute).
- P1:
  - Log each successful price refresh cycle at `debug` level and each graceful degradation at `warn` level.
  - Unit tests cover: successful parse, rate-limit response degradation, network error degradation, missing env var fast-fail.
  - Existing `markets.service.spec.ts` and `markets.gateway.spec.ts` tests must not be broken by the new implementation.
- P2:
  - Expose a `GET /markets/refresh-status` endpoint (or extend existing health endpoint) that returns `{ lastRefreshedAt: ISO8601, symbolCount: number }` for observability.
  - If all 20 symbols fail in a single refresh cycle, log an `error`-level message (potential key expiry or network issue).

#### 6. Acceptance Criteria (Given/When/Then)
- Given the app starts with a valid `TRADING_API_KEY`, when `MarketsService` initializes, then all 20 symbols have a non-zero `price` populated from GLOBAL_QUOTE within 30 seconds.
- Given `TRADING_API_KEY` is missing from the environment, when the NestJS app bootstraps, then it throws a descriptive error and exits before serving any requests.
- Given Alpha Vantage returns a rate-limit JSON body (`{ "Information": "..." }`), when `AlphaVantageService` processes the response, then it returns `null` (not throws), and `MarketsService` retains the cached price for that symbol.
- Given a network timeout occurs during a GLOBAL_QUOTE fetch, when `AlphaVantageService` catches the error, then it returns `null` and logs a `warn`, and `MarketsService` retains the cached price.
- Given prices have been refreshed at least once, when the 60-second interval fires, then all symbols are re-fetched sequentially and the in-memory cache is updated.
- Given a symbol fetch succeeds, when the response is parsed, then `price = parseFloat("05. price")`, `startPrice = parseFloat("08. previous close")`, `change = parseFloat("09. change")`.
- Given the existing `markets.gateway.spec.ts` and `markets.service.spec.ts` test suites are run, when the new code is present, then all previously passing tests continue to pass.
- Given `AlphaVantageService` unit tests are run with mocked `fetch`, when each scenario (success/rate-limit/network-error) is tested, then assertions on return value and log calls pass.

#### 7. Frontend Handoff
- UI/UX requirements:
  - No frontend changes required. The existing `WatchlistItem` summary response already exposes `price`, `change`, and `startPrice`; real values will flow through automatically once the backend is updated.
- States and validation:
  - No new states needed. Prices will be non-zero after the first refresh cycle; the frontend should already handle loading/zero states gracefully.
- Tracking/analytics:
  - No new tracking required for this backend-only change.

#### 8. Backend Handoff
- **Ownership:** backend-engineer exclusively. No frontend-engineer action required.
- API/data requirements:
  - Alpha Vantage base URL: `https://www.alphavantage.co/query`
  - Query params: `function=GLOBAL_QUOTE&symbol=<SYMBOL>&apikey=<TRADING_API_KEY>`
  - Response path: `response["Global Quote"]["05. price"]` etc.
  - Rate-limit/info detection: check for `"Information"` key at the top level of the parsed JSON body.
  - HTTP 429 or non-2xx should also be treated as degradation (return `null`).
- Service design:
  - Create `backend/src/markets/alpha-vantage.service.ts` exporting `AlphaVantageService` as an `@Injectable()`.
  - Method signature: `async fetchQuote(symbol: string): Promise<{ price: number; change: number; startPrice: number } | null>`.
  - Read `TRADING_API_KEY` in the constructor via `process.env.TRADING_API_KEY`; throw `Error('TRADING_API_KEY is not set')` if absent.
  - Use `global.fetch` (Node 18+) — do not add `axios`, `node-fetch`, or other HTTP packages.
  - Register `AlphaVantageService` in `MarketsModule` providers.
- MarketsService changes:
  - Inject `AlphaVantageService`.
  - On `onModuleInit`: iterate all 20 symbols sequentially; after each call `await new Promise(r => setTimeout(r, 1100))` to stay under 25 req/min.
  - On result `null`: retain existing cached price; emit `warn` log.
  - On result non-null: update the symbol's `price`, `change`, `startPrice` in the in-memory symbols map.
  - Schedule 60-second recurring refresh (wrap in try/catch so a full-cycle failure doesn't crash the process).
- Validation/business rules:
  - Never send a request without a valid API key.
  - `parseFloat` all numeric fields from the string response; treat `NaN` as a degradation case (retain cache, log warn).
- Error handling:
  - Wrap each `fetch` call in try/catch; treat all exceptions as degradation.
  - Never propagate Alpha Vantage errors to API consumers — they always receive cached (possibly stale) data.
- Testing:
  - Create `backend/src/markets/alpha-vantage.service.spec.ts`.
  - Mock `global.fetch` using `vi.stubGlobal('fetch', vi.fn(...))`.
  - Test cases: (1) successful quote parse, (2) rate-limit `Information` body returns null, (3) non-2xx HTTP returns null, (4) network exception caught returns null, (5) missing env var throws on construction.
  - Ensure `markets.service.spec.ts` mocks or stubs `AlphaVantageService.fetchQuote` so no real HTTP calls are made.

#### 9. Dependencies and Risks
- Dependencies:
  - `TRADING_API_KEY` must be a valid, active Alpha Vantage free-tier key in `backend/.env`.
  - Node 18+ runtime (for built-in `fetch`). Confirm with backend-engineer that the NestJS runtime version meets this.
  - No new npm packages required.
- Risks:
  - **Rate limit exhaustion:** If the app restarts frequently (e.g., in dev), daily quota of 500 can be consumed quickly. Mitigated by the 60 s interval and sequential 1 s delays.
  - **Alpha Vantage downtime:** Covered by cache-retention degradation — stale prices shown rather than errors.
  - **Key expiry or revocation:** All symbols will silently serve stale prices. P2 full-cycle error log helps surface this. Consider adding a startup validation call.
  - **Market closure / weekend data:** Alpha Vantage returns last available price during off-hours; this is acceptable for the current MVP.

#### 10. Open Questions
- Should the 60-second refresh interval be configurable via an env var (e.g., `PRICE_REFRESH_INTERVAL_MS`) for easier dev/test overrides?
- Should the app make a single validation GLOBAL_QUOTE call on startup to eagerly detect an invalid API key before the full 20-symbol crawl?
- Is Node 18+ guaranteed in the backend Docker/runtime image, or does built-in `fetch` availability need to be confirmed with the engineer?
- Should a P2 `GET /markets/refresh-status` health endpoint be included in the MVP or deferred to a follow-up?

#### 11. Rollout and Validation Plan
- Rollout steps:
  1. Backend-engineer implements `AlphaVantageService` and updates `MarketsService` with unit tests passing.
  2. Smoke test locally: start backend, observe logs showing price refresh for all 20 symbols.
  3. Verify watchlist prices on frontend reflect non-zero, realistic values.
  4. Monitor Alpha Vantage dashboard to confirm daily call count stays within free-tier limit.
  5. Deploy to staging; run existing test suites (unit + integration) to confirm no regressions.
- Post-release checks:
  - Confirm no increase in error rate on watchlist/portfolio endpoints.
  - Verify graceful degradation by temporarily removing `TRADING_API_KEY` and confirming app serves stale prices without crashing.
  - Review daily API usage in the Alpha Vantage dashboard after 48 hours of production traffic.
