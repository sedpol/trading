import { expect, test } from '@playwright/test';

const baseSummary = {
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
    {
      symbol: 'TSLA',
      companyName: 'Tesla, Inc.',
      startPrice: 171.22,
      price: 171.22,
      change: 0.12,
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

test.beforeEach(async ({ page }) => {
  let currentSummary = structuredClone(baseSummary);

  await page.route('**/markets/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(currentSummary),
    });
  });

  await page.route('**/markets/watchlist', async (route) => {
    const payload = route.request().postDataJSON() as { symbol?: string };
    const symbol = payload.symbol;

    const isHeld = currentSummary.positions.some(
      (position) => position.symbol === symbol && position.quantity > 0,
    );
    const isWatchlisted = currentSummary.watchlist.some((item) => item.symbol === symbol);

    if (!isHeld && symbol) {
      if (isWatchlisted) {
        currentSummary.watchlist = currentSummary.watchlist.filter((item) => item.symbol !== symbol);
      } else {
        const market = currentSummary.allMarkets.find((item) => item.symbol === symbol);
        if (market) {
          currentSummary.watchlist = [...currentSummary.watchlist, market];
        }
      }
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(currentSummary),
    });
  });

  await page.route('**/markets/buy', async (route) => {
    const payload = route.request().postDataJSON() as { symbol?: string; quantity?: number };
    const symbol = payload.symbol;
    const quantity = payload.quantity ?? 1;

    if (symbol) {
      const existingPosition = currentSummary.positions.find((position) => position.symbol === symbol);
      if (existingPosition) {
        existingPosition.quantity += quantity;
      } else {
        const market = currentSummary.allMarkets.find((item) => item.symbol === symbol);
        currentSummary.positions = [
          ...currentSummary.positions,
          {
            symbol,
            quantity,
            averagePrice: market?.price ?? 100,
            lots: [{ quantity, boughtPrice: market?.price ?? 100 }],
          },
        ];
      }

      if (!currentSummary.watchlist.some((item) => item.symbol === symbol)) {
        const market = currentSummary.allMarkets.find((item) => item.symbol === symbol);
        if (market) {
          currentSummary.watchlist = [...currentSummary.watchlist, market];
        }
      }
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(currentSummary),
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
  await expect(page.getByRole('button', { name: 'Remove from watchlist AAPL' })).toBeVisible();

  await page.getByRole('link', { name: 'Back to Landing' }).click();
  await expect(page.getByText('Built for Active Traders')).toBeVisible();
});

test('places the back icon visually left of the My Portfolio heading', async ({ page }) => {
  await page.goto('/portfolio');

  const backLink = page.getByRole('link', { name: 'Back to Landing' });
  const portfolioLabel = page.getByText('My Portfolio', { exact: true });

  await expect(backLink).toBeVisible();
  await expect(portfolioLabel).toBeVisible();

  const backBox = await backLink.boundingBox();
  const labelBox = await portfolioLabel.boundingBox();

  expect(backBox).not.toBeNull();
  expect(labelBox).not.toBeNull();
  expect(backBox!.x).toBeLessThan(labelBox!.x);
  expect(backBox!.x + backBox!.width).toBeLessThanOrEqual(labelBox!.x);
});

test('renders an accessible icon-only back control with visible keyboard focus and keyboard navigation', async ({ page }) => {
  await page.goto('/portfolio');

  const backLink = page.getByRole('link', { name: 'Back to Landing' });
  await expect(backLink).toBeVisible();
  await expect(backLink.locator('svg.portfolio-back-icon')).toBeVisible();
  await expect(page.getByText('Back to Landing', { exact: true })).toHaveCount(0);

  await page.keyboard.press('Tab');
  await expect(backLink).toBeFocused();

  const focusStyles = await backLink.evaluate((element) => {
    const styles = window.getComputedStyle(element);
    return {
      outlineStyle: styles.outlineStyle,
      outlineWidth: styles.outlineWidth,
    };
  });

  expect(focusStyles.outlineStyle).not.toBe('none');
  expect(Number.parseFloat(focusStyles.outlineWidth)).toBeGreaterThan(0);

  await page.keyboard.press('Enter');
  await expect(page.getByText('Built for Active Traders')).toBeVisible();
});

test('keeps the back icon visible and tappable on mobile and desktop viewports', async ({ page }) => {
  const viewports = [
    { width: 375, height: 812, minHitSize: 44 },
    { width: 1280, height: 800, minHitSize: 40 },
  ];

  for (const viewport of viewports) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/portfolio');

    const backLink = page.getByRole('link', { name: 'Back to Landing' });
    await expect(backLink).toBeVisible();

    const box = await backLink.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThanOrEqual(viewport.minHitSize);
    expect(box!.height).toBeGreaterThanOrEqual(viewport.minHitSize);
  }
});

test('removes non-held watchlist symbols from portfolio and keeps landing state in sync', async ({ page }) => {
  await page.goto('/portfolio');

  const googToggle = page.getByRole('button', { name: 'Remove from watchlist GOOG' });
  await expect(googToggle).toBeVisible();
  await googToggle.click();

  await expect(page.getByRole('button', { name: 'Remove from watchlist GOOG' })).toHaveCount(0);

  await page.getByRole('link', { name: 'Back to Landing' }).click();
  await expect(page.getByText('Built for Active Traders')).toBeVisible();
  await expect(page.getByText('Showing 1 symbols.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add to watchlist GOOG' })).toBeVisible();
});

test('keeps held symbols protected while heart and expanded trade controls remain usable', async ({ page }) => {
  await page.goto('/portfolio');

  const heldToggle = page.getByRole('button', { name: 'Remove from watchlist AAPL' });
  await expect(heldToggle).toBeDisabled();
  await expect(heldToggle).toHaveAttribute('title', 'Bought shares cannot be removed from watchlist.');

  await page.getByRole('button', { name: 'Expand GOOG' }).click();
  await expect(page.getByText('Alphabet Inc.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Remove from watchlist GOOG' })).toBeVisible();

  await page.getByRole('spinbutton').fill('3');
  await page.getByRole('button', { name: /Buy/i }).click();

  await expect(page.getByText('Bought 3 GOOG share(s).')).toBeVisible();
  await expect(page.getByRole('spinbutton')).toHaveValue('1');
});

test('shows landing connection indicator next to All Markets and keeps interactions usable', async ({ page }) => {
  await page.goto('/');

  const headingRow = page.locator('.landing-markets-heading-row');
  const allMarketsHeading = headingRow.getByRole('heading', { name: 'All Markets' });
  const status = headingRow.getByRole('status', {
    name: 'Connection status: disconnected',
  });

  await expect(allMarketsHeading).toBeVisible();
  await expect(status).toBeVisible();
  await expect(status.locator('.connection-status-dot-disconnected')).toBeVisible();

  await page.getByRole('button', { name: /Price/i }).click();
  const firstMarketRow = page.locator('.landing-market-row:not(.landing-market-header)').first();
  await expect(firstMarketRow).toContainText('TSLA');

  await page.getByRole('button', { name: 'Expand GOOG' }).click();
  await expect(page.getByRole('button', { name: /^Buy$/i })).toBeVisible();
  await expect(status).toBeVisible();
});

test('shows expanded holding lots title using company full name with symbol fallback', async ({ page }) => {
  const summaryWithNamedAndUnnamedHoldings = {
    ...baseSummary,
    positions: [
      {
        symbol: 'AAPL',
        quantity: 2,
        averagePrice: 200,
        lots: [{ quantity: 2, boughtPrice: 200 }],
      },
      {
        symbol: 'ZZZZ',
        quantity: 1,
        averagePrice: 50,
        lots: [{ quantity: 1, boughtPrice: 50 }],
      },
    ],
  };

  await page.unroute('**/markets/summary');
  await page.route('**/markets/summary', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(summaryWithNamedAndUnnamedHoldings),
    });
  });

  await page.goto('/portfolio');

  const holdingsPanel = page.locator('article.panel', {
    has: page.getByRole('heading', { name: 'Holdings P&L' }),
  });

  await holdingsPanel.locator('.pnl-row-button', { hasText: 'AAPL' }).click();
  await expect(holdingsPanel.getByText('Apple Inc. Buy Lots')).toBeVisible();

  await holdingsPanel.locator('.pnl-row-button', { hasText: 'ZZZZ' }).click();
  await expect(holdingsPanel.getByText('ZZZZ Buy Lots')).toBeVisible();
});
