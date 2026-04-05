import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MessageBanner } from './MessageBanner';

describe('MessageBanner', () => {
  it('renders the requested variant and optional prefix', () => {
    render(<MessageBanner message="Trade failed." prefix="Error: " variant="error" />);

    const banner = screen.getByRole('alert');
    expect(banner).toHaveClass('message-banner', 'message-banner-error', 'error-banner');
    expect(banner).toHaveTextContent('Error: Trade failed.');
  });

  it('renders compact informational messages', () => {
    render(<MessageBanner compact message="Live prices connected" variant="info" />);

    const banner = screen.getByRole('status');
    expect(banner).toHaveClass('message-banner', 'message-banner-info', 'message-banner-compact');
    expect(banner).toHaveTextContent('Live prices connected');
  });
});