import { fireEvent, render, screen } from '@testing-library/react';
import { Watchlist } from './Watchlist';

describe('Watchlist', () => {
  const watchlistItem = {
    symbol: 'AAPL',
    companyName: 'Apple Inc.',
    startPrice: 212.48,
    price: 212.48,
    change: 1.23,
  };

  it('renders a watchlist item and expands to show the company full name', async () => {
    const onQuantityChange = vi.fn();
    const onTrade = vi.fn();

    render(
      <Watchlist
        watchlist={[watchlistItem]}
        tradeQuantity={{ AAPL: 1 }}
        activeTradeKey={null}
        isLoading={false}
        onQuantityChange={onQuantityChange}
        onTrade={onTrade}
      />,
    );

    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('£212.48')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /AAPL/i }));

    expect(await screen.findByText('Apple Inc.')).toBeInTheDocument();
    expect(screen.getByRole('spinbutton')).toHaveValue(1);
    expect(screen.getByRole('button', { name: /Buy/i })).toBeEnabled();
    expect(screen.getByRole('button', { name: /Sell/i })).toBeEnabled();

    fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '2' } });
    expect(onQuantityChange).toHaveBeenCalledWith('AAPL', 2);
  });

  it('sorts the watchlist by price and toggles sort direction', () => {
    const watchlistTwo = [
      watchlistItem,
      {
        symbol: 'GOOG',
        companyName: 'Alphabet Inc.',
        startPrice: 176.91,
        price: 320.12,
        change: -0.45,
      },
    ];
    const onQuantityChange = vi.fn();
    const onTrade = vi.fn();
    const { container } = render(
      <Watchlist
        watchlist={watchlistTwo}
        tradeQuantity={{ AAPL: 1, GOOG: 1 }}
        activeTradeKey={null}
        isLoading={false}
        onQuantityChange={onQuantityChange}
        onTrade={onTrade}
      />,
    );

    const rowLabels = Array.from(container.querySelectorAll('.watchlist-row-header .watchlist-main > span:first-child'))
      .map((node) => node.textContent);

    expect(rowLabels).toEqual(['AAPL', 'GOOG']);

    fireEvent.click(screen.getByRole('button', { name: /Price/i }));

    const sortedAsc = Array.from(container.querySelectorAll('.watchlist-row-header .watchlist-main > span:first-child'))
      .map((node) => node.textContent);
    expect(sortedAsc).toEqual(['AAPL', 'GOOG']);

    fireEvent.click(screen.getByRole('button', { name: /Price/i }));

    const sortedDesc = Array.from(container.querySelectorAll('.watchlist-row-header .watchlist-main > span:first-child'))
      .map((node) => node.textContent);
    expect(sortedDesc).toEqual(['GOOG', 'AAPL']);
  });
});
