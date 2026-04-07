import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

type FormErrors = {
  identifier?: string;
  password?: string;
};

type LocationState = {
  from?: string;
  reason?: string;
};

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const redirectTarget = useMemo(() => {
    const state = location.state as LocationState | null;

    if (!state?.from || !state.from.startsWith('/')) {
      return '/portfolio';
    }

    return state.from;
  }, [location.state]);

  useEffect(() => {
    const state = location.state as LocationState | null;

    if (state?.reason === 'session-expired') {
      setSubmitError('Your session expired. Please sign in again to continue.');
    }
  }, [location.state]);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    navigate(redirectTarget, { replace: true });
  }, [isAuthenticated, navigate, redirectTarget]);

  const validate = () => {
    const nextErrors: FormErrors = {};

    if (!identifier.trim()) {
      nextErrors.identifier = 'Email or username is required.';
    }

    if (!password) {
      nextErrors.password = 'Password is required.';
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setSubmitError(null);
    setIsSubmitting(true);

    const result = await login(identifier, password);

    if (!result.ok) {
      setSubmitError(result.message);
      setIsSubmitting(false);
      return;
    }

    navigate(redirectTarget, { replace: true });
  };

  return (
    <main className="auth-page-shell">
      <section className="auth-card" aria-labelledby="login-heading">
        <p className="auth-kicker">Account Access</p>
        <h1 id="login-heading">Sign in to view your watchlist</h1>
        <p className="auth-helper-copy">
          Your watchlist and portfolio are private. Sign in to continue.
        </p>

        <form className="auth-form" onSubmit={onSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="identifier">Email or username</label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              value={identifier}
              onChange={(event) => {
                setIdentifier(event.target.value);
                if (errors.identifier) {
                  setErrors((current) => ({ ...current, identifier: undefined }));
                }
              }}
              aria-invalid={Boolean(errors.identifier)}
              aria-describedby={errors.identifier ? 'identifier-error' : undefined}
            />
            {errors.identifier && (
              <p id="identifier-error" className="auth-field-error" role="alert">
                {errors.identifier}
              </p>
            )}
          </div>

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                if (errors.password) {
                  setErrors((current) => ({ ...current, password: undefined }));
                }
              }}
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            {errors.password && (
              <p id="password-error" className="auth-field-error" role="alert">
                {errors.password}
              </p>
            )}
          </div>

          {submitError && (
            <p className="auth-submit-error" role="alert">{submitError}</p>
          )}

          <button type="submit" className="auth-submit-button" disabled={isSubmitting}>
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="auth-home-link-wrap">
          <Link to="/" className="auth-home-link">Back to landing page</Link>
        </p>
      </section>
    </main>
  );
}
