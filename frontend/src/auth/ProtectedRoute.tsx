import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';

type ProtectedRouteProps = {
  children: JSX.Element;
};

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthResolved, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthResolved) {
    return (
      <main className="auth-loading-shell">
        <p role="status" aria-live="polite">Checking your session...</p>
      </main>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: `${location.pathname}${location.search}`,
        }}
      />
    );
  }

  return children;
}
