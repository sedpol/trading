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

test.beforeEach(async ({ page }) => {
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
});

test('shows trading landing page as default route', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByText('Built for Active Traders')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to My Portfolio' })).toBeVisible();
  await expect(page.getByText('Risk warning: Trading involves risk of loss.')).toBeVisible();
});

test('navigates between landing and portfolio pages', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'Go to My Portfolio' }).click();
  await expect(page.getByText('My Portfolio')).toBeVisible();
  await expect(page.getByText('AAPL')).toBeVisible();

  await page.getByRole('link', { name: 'Back to Landing' }).click();
  await expect(page.getByText('Built for Active Traders')).toBeVisible();
});
