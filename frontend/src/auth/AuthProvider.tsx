import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AUTH_STORAGE_KEY } from './constants';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthSession = {
  identifier: string;
};

type LoginResult = {
  ok: true;
} | {
  ok: false;
  message: string;
};

type SessionValidationResult =
  | { state: 'authenticated'; session: AuthSession }
  | { state: 'unauthenticated' }
  | { state: 'unreachable' };

type AuthContextValue = {
  status: AuthStatus;
  isAuthenticated: boolean;
  isAuthResolved: boolean;
  user: AuthSession | null;
  login: (identifier: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
const LOCAL_AUTH_FALLBACK_ENABLED = (import.meta.env.VITE_ENABLE_LOCAL_AUTH_FALLBACK ?? 'false') === 'true';

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const readStoredSession = (): AuthSession | null => {
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as AuthSession;

    if (typeof parsed.identifier !== 'string' || parsed.identifier.trim().length === 0) {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return {
      identifier: parsed.identifier,
    };
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

const persistSession = (session: AuthSession | null) => {
  if (!session) {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<AuthSession | null>(null);

  const validateServerSession = useCallback(async (fallbackIdentifier?: string): Promise<SessionValidationResult> => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/session`, {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const body = (await response.json().catch(() => null)) as {
          user?: { identifier?: string; username?: string; email?: string };
        } | null;
        const identifier = (body?.user?.identifier ?? body?.user?.username ?? body?.user?.email)?.trim();

        if (identifier) {
          return {
            state: 'authenticated',
            session: { identifier },
          };
        }
      }

      if (response.status === 404 && LOCAL_AUTH_FALLBACK_ENABLED && fallbackIdentifier?.trim()) {
        return {
          state: 'authenticated',
          session: { identifier: fallbackIdentifier.trim() },
        };
      }

      return { state: 'unauthenticated' };
    } catch {
      return { state: 'unreachable' };
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrapAuth = async () => {
      const storedSession = readStoredSession();
      const sessionResult = await validateServerSession(storedSession?.identifier);

      if (!isMounted) {
        return;
      }

      if (sessionResult.state === 'authenticated') {
        persistSession(sessionResult.session);
        setUser(sessionResult.session);
        setStatus('authenticated');
        return;
      }

      if (sessionResult.state === 'unreachable' && storedSession) {
        setUser(storedSession);
        setStatus('authenticated');
        return;
      }

      persistSession(null);
      setUser(null);
      setStatus('unauthenticated');
    };

    bootstrapAuth();

    return () => {
      isMounted = false;
    };
  }, [validateServerSession]);

  const login = useCallback(async (identifier: string, password: string): Promise<LoginResult> => {
    const normalizedIdentifier = identifier.trim();

    if (!normalizedIdentifier || !password) {
      return {
        ok: false,
        message: 'Please enter your email or username and password.',
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier: normalizedIdentifier, password }),
        credentials: 'include',
      });

      if (response.ok) {
        const responseBody = (await response.json().catch(() => null)) as { user?: { identifier?: string } } | null;
        const identifier = responseBody?.user?.identifier?.trim() || normalizedIdentifier;
        const sessionResult = await validateServerSession(identifier);

        if (sessionResult.state === 'unauthenticated') {
          persistSession(null);
          setUser(null);
          setStatus('unauthenticated');

          return {
            ok: false,
            message: 'Sign in succeeded, but your session could not be verified. Please try again.',
          };
        }

        const session = sessionResult.state === 'authenticated'
          ? sessionResult.session
          : { identifier };

        persistSession(session);
        setUser(session);
        setStatus('authenticated');

        return { ok: true };
      }

      if (response.status === 401) {
        return {
          ok: false,
          message: 'Invalid credentials. Please try again.',
        };
      }

      if (response.status === 404 && LOCAL_AUTH_FALLBACK_ENABLED) {
        const session = { identifier: normalizedIdentifier };
        persistSession(session);
        setUser(session);
        setStatus('authenticated');
        return { ok: true };
      }

      return {
        ok: false,
        message: 'Unable to sign in right now. Please try again.',
      };
    } catch {
      return {
        ok: false,
        message: 'Unable to sign in right now. Please check your connection.',
      };
    }
  }, [validateServerSession]);

  const logout = useCallback(async () => {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch {
      // The local session should still be removed even if the server is unavailable.
    }

    persistSession(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    status,
    isAuthenticated: status === 'authenticated',
    isAuthResolved: status !== 'loading',
    user,
    login,
    logout,
  }), [status, user, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
