import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { loginRequest, logoutRequest, validateSession } from '../api/auth';
import { persistSession, readStoredSession } from '../storage/authStorage';
import type { AuthSessionRecord, AuthenticatedUser, ProtectedRouteName } from '../types';

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type AuthContextValue = {
  authMessage: string | null;
  clearPendingAuth: () => void;
  isAuthenticated: boolean;
  isAuthResolved: boolean;
  login: (identifier: string, password: string) => Promise<{ ok: boolean; message?: string }>;
  logout: () => Promise<void>;
  pendingRoute: ProtectedRouteName | null;
  requestSignIn: (route: ProtectedRouteName) => void;
  requireReauth: (route: ProtectedRouteName) => Promise<void>;
  session: AuthSessionRecord | null;
  status: AuthStatus;
  user: AuthenticatedUser | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [session, setSession] = useState<AuthSessionRecord | null>(null);
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [pendingRoute, setPendingRoute] = useState<ProtectedRouteName | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const storedSession = await readStoredSession();

      if (!storedSession) {
        if (!isMounted) {
          return;
        }

        setStatus('unauthenticated');
        return;
      }

      const result = await validateSession(storedSession);

      if (!isMounted) {
        return;
      }

      if (result.state === 'authenticated') {
        await persistSession(result.session);
        setSession(result.session);
        setUser(result.user);
        setStatus('authenticated');
        return;
      }

      await persistSession(null);
      setSession(null);
      setUser(null);
      setStatus('unauthenticated');

      if (result.state === 'unreachable') {
        setAuthMessage(result.message);
      }
    };

    void bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  const clearPendingAuth = useCallback(() => {
    setPendingRoute(null);
    setAuthMessage(null);
  }, []);

  const requestSignIn = useCallback((route: ProtectedRouteName) => {
    setPendingRoute(route);
    setAuthMessage(null);
  }, []);

  const requireReauth = useCallback(async (route: ProtectedRouteName) => {
    setPendingRoute(route);
    setAuthMessage('Your session expired. Please sign in again to continue.');
    await persistSession(null);
    setSession(null);
    setUser(null);
    setStatus('unauthenticated');
  }, []);

  const login = useCallback(async (identifier: string, password: string) => {
    const result = await loginRequest(identifier, password);

    if (!result.ok) {
      return result;
    }

    await persistSession(result.session);
    setSession(result.session);
    setUser(result.user);
    setStatus('authenticated');
    setAuthMessage(null);

    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    await logoutRequest(session?.token);
    await persistSession(null);
    setSession(null);
    setUser(null);
    setPendingRoute(null);
    setAuthMessage(null);
    setStatus('unauthenticated');
  }, [session?.token]);

  const value = useMemo<AuthContextValue>(() => ({
    authMessage,
    clearPendingAuth,
    isAuthenticated: status === 'authenticated',
    isAuthResolved: status !== 'loading',
    login,
    logout,
    pendingRoute,
    requestSignIn,
    requireReauth,
    session,
    status,
    user,
  }), [authMessage, clearPendingAuth, login, logout, pendingRoute, requestSignIn, requireReauth, session, status, user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}