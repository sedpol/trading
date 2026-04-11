import { API_BASE_URL, SESSION_COOKIE_NAME } from '../config';
import { ApiError, readJsonSafely } from './client';
import type { ApiUser, AuthSessionRecord, AuthenticatedUser } from '../types';

type LoginResponse = {
  authenticated: boolean;
  expiresAt?: number;
  sessionToken?: string;
  user?: ApiUser;
  message?: string | string[];
};

type SessionResponse = {
  authenticated: boolean;
  user?: ApiUser;
};

type LoginResult =
  | {
      ok: true;
      session: AuthSessionRecord;
      user: AuthenticatedUser;
    }
  | {
      ok: false;
      message: string;
    };

type SessionValidationResult =
  | {
      state: 'authenticated';
      session: AuthSessionRecord;
      user: AuthenticatedUser;
    }
  | {
      state: 'unauthenticated';
    }
  | {
      state: 'unreachable';
      message: string;
    };

const normalizeIdentifier = (user: ApiUser | undefined, fallback: string) =>
  user?.identifier?.trim() || user?.username?.trim() || user?.email?.trim() || fallback.trim();

const toUser = (user: ApiUser | undefined, fallbackIdentifier: string): AuthenticatedUser => ({
  email: user?.email?.trim() || fallbackIdentifier.trim(),
  id: user?.id?.trim() || fallbackIdentifier.trim(),
  identifier: normalizeIdentifier(user, fallbackIdentifier),
  username: user?.username?.trim() || fallbackIdentifier.trim(),
});

export const parseSessionCookie = (cookieHeader: string | null | undefined) => {
  if (!cookieHeader) {
    return null;
  }

  const cookieParts = cookieHeader.split(';');

  for (const part of cookieParts) {
    const [name, ...rest] = part.trim().split('=');

    if (name === SESSION_COOKIE_NAME) {
      const value = rest.join('=').trim();
      return value || null;
    }
  }

  return null;
};

export const extractSessionToken = (response: Response, payload: LoginResponse) => {
  if (payload.sessionToken?.trim()) {
    return payload.sessionToken.trim();
  }

  return parseSessionCookie(response.headers.get('set-cookie'));
};

export async function loginRequest(identifier: string, password: string): Promise<LoginResult> {
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
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ identifier: normalizedIdentifier, password }),
    });

    const payload = (await readJsonSafely<LoginResponse>(response)) ?? { authenticated: false };

    if (!response.ok) {
      if (response.status === 401) {
        return {
          ok: false,
          message: 'Invalid credentials. For local demo sign-in, use the credentials configured in backend/.env.',
        };
      }

      const message = Array.isArray(payload.message)
        ? payload.message.join(', ')
        : payload.message ?? 'Unable to sign in right now. Please try again.';

      return {
        ok: false,
        message,
      };
    }

    const token = extractSessionToken(response, payload);

    if (!token) {
      return {
        ok: false,
        message: 'Sign in succeeded, but the backend did not return a reusable mobile session token.',
      };
    }

    const user = toUser(payload.user, normalizedIdentifier);

    return {
      ok: true,
      session: {
        token,
        identifier: user.identifier,
        expiresAt: typeof payload.expiresAt === 'number' ? payload.expiresAt : null,
      },
      user,
    };
  } catch {
    return {
      ok: false,
      message: 'Unable to sign in right now. Please check your connection.',
    };
  }
}

export async function validateSession(
  session: AuthSessionRecord,
): Promise<SessionValidationResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/session`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${session.token}`,
      },
    });

    if (response.status === 401) {
      return { state: 'unauthenticated' };
    }

    const payload = await readJsonSafely<SessionResponse>(response);

    if (!response.ok || !payload?.authenticated) {
      throw new ApiError('Unable to verify session.', response.status, payload);
    }

    const user = toUser(payload.user, session.identifier);

    return {
      state: 'authenticated',
      session: {
        token: session.token,
        identifier: user.identifier,
        expiresAt: session.expiresAt ?? null,
      },
      user,
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return { state: 'unauthenticated' };
    }

    return {
      state: 'unreachable',
      message: 'Unable to verify your session right now.',
    };
  }
}

export async function logoutRequest(token?: string) {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: token
        ? {
            Accept: 'application/json',
            Authorization: `Bearer ${token}`,
          }
        : {
            Accept: 'application/json',
          },
    });
  } catch {
    return;
  }
}
