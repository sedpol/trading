import type { Summary } from '../types';

type StatsGridProps = {
  isLoading: boolean;
  summary: Summary | null;
};

const gbp = new Intl.NumberFormat('en-GB', {
  style: 'currency',
  currency: 'GBP',
});

export function StatsGrid({ isLoading, summary }: StatsGridProps) {
  return (
    <section className="stats-grid">
      <article className="card">
        <span>Total Balance</span>
        <strong>{isLoading ? 'Loading...' : summary ? gbp.format(summary.balance) : '--'}</strong>
      </article>

      <article className="card">
        <span>Cash Balance</span>
        <strong>{isLoading ? 'Loading...' : summary ? gbp.format(summary.cashBalance) : '--'}</strong>
      </article>

      <article className="card">
        <span>Total P&amp;L</span>
        <strong>{isLoading ? 'Loading...' : summary ? gbp.format(summary.dailyPnl) : '--'}</strong>
      </article>
    </section>
  );
}
