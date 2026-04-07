import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import {
  AuthSession,
  AuthenticatedUser,
  LoginRequest,
  SESSION_COOKIE_NAME,
} from './auth.types';

const SESSION_TTL_MS = 1000 * 60 * 60 * 8;

const readRequiredEnv = (name: string) => {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required auth environment variable: ${name}`);
  }

  return value;
};

const getDemoUser = (): AuthenticatedUser & { password: string } => ({
  id: process.env.DEMO_AUTH_USER_ID?.trim() || 'user-demo-1',
  username: process.env.DEMO_AUTH_USERNAME?.trim() || 'trader',
  email: process.env.DEMO_AUTH_EMAIL?.trim() || 'trader@example.com',
  password: readRequiredEnv('DEMO_AUTH_PASSWORD'),
});

type SessionLookupInput = {
  headers?: Record<string, unknown>;
  auth?: Record<string, unknown>;
  cookies?: Record<string, unknown>;
};

type HttpSessionLookupInput = {
  headers?: Record<string, unknown>;
  cookies?: Record<string, unknown>;
};

const readHeaderValue = (headers: Record<string, unknown>, key: string) => {
  const directValue = headers[key];

  if (typeof directValue === 'string') {
    return directValue;
  }

  if (Array.isArray(directValue) && typeof directValue[0] === 'string') {
    return directValue[0];
  }

  const matchedKey = Object.keys(headers).find((headerKey) => headerKey.toLowerCase() === key.toLowerCase());

  if (!matchedKey) {
    return undefined;
  }

  const matchedValue = headers[matchedKey];

  if (typeof matchedValue === 'string') {
    return matchedValue;
  }

  if (Array.isArray(matchedValue) && typeof matchedValue[0] === 'string') {
    return matchedValue[0];
  }

  return undefined;
};

const decodeCookieToken = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

@Injectable()
export class AuthService {
  private readonly sessions = new Map<string, AuthSession>();

  login(request: LoginRequest) {
    const demoUser = getDemoUser();
    const identifier = request?.identifier?.trim();
    const password = request?.password;

    if (!identifier || !password) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const normalizedIdentifier = identifier.toLowerCase();
    const isIdentifierValid =
      normalizedIdentifier === demoUser.email.toLowerCase() ||
      normalizedIdentifier === demoUser.username.toLowerCase();

    if (!isIdentifierValid || password !== demoUser.password) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const token = randomUUID();
    const expiresAt = Date.now() + SESSION_TTL_MS;
    const session: AuthSession = {
      token,
      expiresAt,
      user: {
        id: demoUser.id,
        username: demoUser.username,
        email: demoUser.email,
      },
    };

    this.sessions.set(token, session);

    return session;
  }

  logout(token?: string) {
    if (!token) {
      return;
    }

    this.sessions.delete(token);
  }

  resolveSessionFromInput(input: SessionLookupInput) {
    const token = this.extractSessionToken(input);

    if (!token) {
      return null;
    }

    const session = this.sessions.get(token);

    if (!session) {
      return null;
    }

    if (session.expiresAt <= Date.now()) {
      this.sessions.delete(token);
      return null;
    }

    return session;
  }

  resolveSessionFromHttpRequest(request: HttpSessionLookupInput) {
    return this.resolveSessionFromInput({
      headers: request.headers,
      cookies: request.cookies,
    });
  }

  extractSessionToken(input: SessionLookupInput) {
    const headers = input.headers ?? {};
    const sessionTokenHeader = readHeaderValue(headers, 'x-session-token');

    if (sessionTokenHeader?.trim()) {
      return sessionTokenHeader.trim();
    }

    const authorizationHeader = readHeaderValue(headers, 'authorization');

    if (typeof authorizationHeader === 'string') {
      const [scheme, value] = authorizationHeader.trim().split(/\s+/, 2);

      if (scheme?.toLowerCase() === 'bearer' && value?.trim()) {
        return value.trim();
      }
    }

    const cookieHeader = readHeaderValue(headers, 'cookie');

    if (typeof cookieHeader === 'string') {
      const cookies = cookieHeader.split(';');

      for (const cookie of cookies) {
        const [name, ...rest] = cookie.trim().split('=');

        if (name === SESSION_COOKIE_NAME) {
          const value = rest.join('=').trim();

          if (value) {
            return decodeCookieToken(value);
          }
        }
      }
    }

    const parsedCookie = input.cookies?.[SESSION_COOKIE_NAME];

    if (typeof parsedCookie === 'string' && parsedCookie.trim()) {
      return decodeCookieToken(parsedCookie.trim());
    }

    const authPayload = input.auth;
    const authSessionToken =
      authPayload?.sessionToken ?? authPayload?.token ?? authPayload?.authorization;

    if (typeof authSessionToken === 'string' && authSessionToken.trim()) {
      if (authSessionToken.toLowerCase().startsWith('bearer ')) {
        return authSessionToken.slice(7).trim();
      }

      return authSessionToken.trim();
    }

    return undefined;
  }
}
