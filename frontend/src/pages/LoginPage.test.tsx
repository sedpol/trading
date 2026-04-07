import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../auth/AuthProvider';
import { AUTH_STORAGE_KEY } from '../auth/constants';
import { LoginPage } from './LoginPage';

const renderLoginPage = (initialEntry = '/login') => render(
  <MemoryRouter
    initialEntries={[
      {
        pathname: initialEntry,
        state: { from: '/portfolio' },
      },
    ]}
  >
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/portfolio" element={<h1>Portfolio destination</h1>} />
      </Routes>
    </AuthProvider>
  </MemoryRouter>,
);

describe('LoginPage', () => {
  beforeEach(() => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo) => {
      if (typeof input === 'string' && input.endsWith('/auth/session')) {
        return {
          ok: false,
          status: 401,
        } as Response;
      }

      return {
        ok: false,
        status: 500,
      } as Response;
    }));
  });

  afterEach(() => {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    vi.restoreAllMocks();
  });

  it('shows required field validation errors before submit', async () => {
    renderLoginPage();

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Email or username is required.')).toBeInTheDocument();
    expect(screen.getByText('Password is required.')).toBeInTheDocument();
  });

  it('shows session-expired messaging when redirected from a protected route', async () => {
    render(
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/login',
            state: { from: '/portfolio', reason: 'session-expired' },
          },
        ]}
      >
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/portfolio" element={<h1>Portfolio destination</h1>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText('Your session expired. Please sign in again to continue.')).toBeInTheDocument();
  });

  it('shows authentication failure messaging for invalid credentials', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo) => {
      if (typeof input === 'string' && input.endsWith('/auth/login')) {
        return {
          ok: false,
          status: 401,
        } as Response;
      }

      return {
        ok: true,
        json: async () => ({}),
      } as Response;
    }));

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/Email or username/i), {
      target: { value: 'demo-user' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'wrong-pass' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Invalid credentials. Please try again.')).toBeInTheDocument();
  });

  it('signs in successfully and redirects to the protected destination', async () => {
    let sessionChecks = 0;

    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo) => {
      if (typeof input === 'string' && input.endsWith('/auth/session')) {
        sessionChecks += 1;

        if (sessionChecks === 1) {
          return {
            ok: false,
            status: 401,
          } as Response;
        }

        return {
          ok: true,
          json: async () => ({ user: { identifier: 'demo-user' } }),
        } as Response;
      }

      if (typeof input === 'string' && input.endsWith('/auth/login')) {
        return {
          ok: true,
          json: async () => ({ user: { identifier: 'demo-user' } }),
        } as Response;
      }

      return {
        ok: false,
        status: 500,
      } as Response;
    }));

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/Email or username/i), {
      target: { value: 'demo-user' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'trading-pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Portfolio destination' })).toBeInTheDocument();
    });
  });

  it('keeps user signed out when login succeeds but session validation fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo) => {
      if (typeof input === 'string' && input.endsWith('/auth/login')) {
        return {
          ok: true,
          json: async () => ({ user: { identifier: 'demo-user' } }),
        } as Response;
      }

      if (typeof input === 'string' && input.endsWith('/auth/session')) {
        return {
          ok: false,
          status: 401,
        } as Response;
      }

      return {
        ok: false,
        status: 500,
      } as Response;
    }));

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/Email or username/i), {
      target: { value: 'demo-user' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'trading-pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Sign in succeeded, but your session could not be verified. Please try again.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Portfolio destination' })).not.toBeInTheDocument();
  });

  it('does not authenticate on login endpoint 404 unless fallback is explicitly enabled', async () => {
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo) => {
      if (typeof input === 'string' && input.endsWith('/auth/login')) {
        return {
          ok: false,
          status: 404,
        } as Response;
      }

      if (typeof input === 'string' && input.endsWith('/auth/session')) {
        return {
          ok: false,
          status: 401,
        } as Response;
      }

      return {
        ok: false,
        status: 500,
      } as Response;
    }));

    renderLoginPage();

    fireEvent.change(screen.getByLabelText(/Email or username/i), {
      target: { value: 'demo-user' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'trading-pass' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Unable to sign in right now. Please try again.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Portfolio destination' })).not.toBeInTheDocument();
  });
});
