import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { HoldingsPnl } from './HoldingsPnl';

describe('HoldingsPnl', () => {
  it('sorts holdings by Total P&L and toggles sort direction', () => {
    const positionsWithPnl = [
      {
        symbol: 'AAPL',
        quantity: 2,
        averagePrice: 200,
        marketPrice: 210,
        pnlPerShare: 10,
        totalPnl: 20,
        lots: [{ quantity: 2, boughtPrice: 200 }],
      },
      {
        symbol: 'GOOG',
        quantity: 1,
        averagePrice: 3000,
        marketPrice: 3050,
        pnlPerShare: 50,
        totalPnl: 50,
        lots: [{ quantity: 1, boughtPrice: 3000 }],
      },
    ];

    const { container } = render(
      <HoldingsPnl
        isLoading={false}
        positionsWithPnl={positionsWithPnl}
        selectedHolding={null}
        toggleHolding={() => {}}
      />
    );

    const totalPnlHeader = screen.getByRole('button', { name: /Total P&L/i });
    fireEvent.click(totalPnlHeader);

    const rowLabels = Array.from(container.querySelectorAll('.pnl-row span:first-child')).map(
      (element) => element.textContent
    );

    expect(rowLabels).toEqual(['AAPL', 'GOOG']);

    fireEvent.click(totalPnlHeader);

    const reversedRowLabels = Array.from(container.querySelectorAll('.pnl-row span:first-child')).map(
      (element) => element.textContent
    );

    expect(reversedRowLabels).toEqual(['GOOG', 'AAPL']);
  });
});
