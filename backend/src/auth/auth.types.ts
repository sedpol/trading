export const SESSION_COOKIE_NAME = 'trading_sid';

export type AuthenticatedUser = {
  id: string;
  username: string;
  email: string;
};

export type AuthSession = {
  token: string;
  user: AuthenticatedUser;
  expiresAt: number;
};

export type LoginRequest = {
  identifier: string;
  password: string;
};

export type SessionResponse = {
  authenticated: boolean;
  user: AuthenticatedUser;
};
