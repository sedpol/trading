import { expect, test } from '@playwright/test';

const authSessionKey = 'trading.auth.session';

const summaryWithWatchlist = {
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
  ],
  positions: [
    {
      symbol: 'AAPL',
      quantity: 1,
      averagePrice: 200,
      lots: [{ quantity: 1, boughtPrice: 200 }],
    },
  ],
  history: [],
};

test('redirects guests away from protected watchlist route', async ({ page }) => {
  await page.goto('/portfolio');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Sign in to view your watchlist' })).toBeVisible();
  await expect(page.getByText('Showing 2 symbols.')).toHaveCount(0);
});

test('does not expose watchlist rows or counts to guests on landing', async ({ page }) => {
  await page.route('**/markets/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(summaryWithWatchlist),
    });
  });

  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Watchlist locked' })).toBeVisible();
  await expect(page.getByText('Sign in to view your watchlist symbols and counts.')).toBeVisible();
  await expect(page.getByText('Showing 2 symbols.')).toHaveCount(0);
  await expect(page.locator('.landing-watchlist-chip')).toHaveCount(0);
});

test('logs in and returns user to originally requested protected route', async ({ page }) => {
  let loginDone = false;

  await page.route('**/auth/session', async (route) => {
    if (loginDone) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { identifier: 'trader' } }),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthorized' }),
      });
    }
  });

  await page.route('**/auth/login', async (route) => {
    loginDone = true;
    await route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify({ user: { identifier: 'trader' } }),
    });
  });

  await page.route('**/markets/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(summaryWithWatchlist),
    });
  });

  await page.goto('/portfolio');
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel('Email or username').fill('trader');
  await page.getByLabel('Password').fill('trading123');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/portfolio$/);
  await expect(page.getByText('My Portfolio')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove from watchlist AAPL' })).toBeVisible();
});

test('removes an item from watchlist for authenticated user', async ({ page }) => {
  let summaryCallCount = 0;

  await page.route('**/auth/session', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ user: { identifier: 'trader' } }),
    });
  });

  await page.route('**/markets/summary', async (route) => {
    summaryCallCount += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(summaryWithWatchlist),
    });
  });

  await page.route('**/markets/watchlist', async (route) => {
    const payload = route.request().postDataJSON() as { symbol?: string };

    expect(payload.symbol).toBe('GOOG');

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ...summaryWithWatchlist,
        watchlist: summaryWithWatchlist.watchlist.filter((item) => item.symbol !== 'GOOG'),
      }),
    });
  });

  await page.goto('/');
  await page.evaluate((key) => {
    window.localStorage.setItem(key, JSON.stringify({ identifier: 'trader' }));
  }, authSessionKey);

  await page.goto('/portfolio');

  await expect(page.getByRole('button', { name: 'Remove from watchlist AAPL' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove from watchlist GOOG' })).toBeVisible();

  await page.getByRole('button', { name: 'Remove from watchlist GOOG' }).click();

  await expect(page.getByRole('button', { name: 'Remove from watchlist GOOG' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Remove from watchlist AAPL' })).toBeVisible();
  expect(summaryCallCount).toBeGreaterThan(0);
});

test('shows an actionable error for invalid credentials and keeps user logged out', async ({ page }) => {
  await page.route('**/auth/login', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Unauthorized' }),
    });
  });

  await page.goto('/login');

  await page.getByLabel('Email or username').fill('trader');
  await page.getByLabel('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByText('Invalid credentials. Please try again.')).toBeVisible();
});

test('logout revokes watchlist access and redirects future protected navigation back to login', async ({ page }) => {
  await page.goto('/');
  await page.evaluate((key) => {
    window.localStorage.setItem(key, JSON.stringify({ identifier: 'trader' }));
  }, authSessionKey);

  let loggedOut = false;

  await page.route('**/auth/session', async (route) => {
    if (loggedOut) {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthorized' }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { identifier: 'trader' } }),
      });
    }
  });

  await page.route('**/auth/logout', async (route) => {
    loggedOut = true;
    await route.fulfill({ status: 201, body: '{}' });
  });

  await page.route('**/markets/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(summaryWithWatchlist),
    });
  });

  await page.goto('/portfolio');
  await expect(page.getByText('My Portfolio')).toBeVisible();

  await page.getByRole('button', { name: 'Log out' }).click();

  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/portfolio');
  await expect(page).toHaveURL(/\/login$/);
});
