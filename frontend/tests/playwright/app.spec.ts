import { expect, test } from '@playwright/test';

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
      change: 1.23,
    },
  ],
  positions: [],
  history: [],
};

test('loads the dashboard, expands watchlist rows, and executes a trade', async ({ page }) => {
  await page.route('**/markets/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSummary),
    });
  });

  await page.route('**/markets/buy', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockSummary),
    });
  });

  await page.goto('/');

  await expect(page.locator('text=Trading Dashboard')).toBeVisible();
  await page.getByRole('button', { name: /AAPL/i }).click();
  await expect(page.locator('text=Apple Inc.')).toBeVisible();

  await page.fill('input[type=number]', '3');
  await page.getByRole('button', { name: /Buy/i }).click();

  await expect(page.locator('text=Bought 3 AAPL share(s).')).toBeVisible();
  await expect(page.locator('input[type=number]')).toHaveValue('1');
});
