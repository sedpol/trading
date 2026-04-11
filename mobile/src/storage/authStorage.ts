import * as SecureStore from 'expo-secure-store';
import type { AuthSessionRecord } from '../types';

const AUTH_SESSION_KEY = 'trading.mobile.auth-session';

export async function readStoredSession() {
  const raw = await SecureStore.getItemAsync(AUTH_SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as AuthSessionRecord;

    if (!parsed.token?.trim() || !parsed.identifier?.trim()) {
      await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
      return null;
    }

    return {
      token: parsed.token.trim(),
      identifier: parsed.identifier.trim(),
      expiresAt: typeof parsed.expiresAt === 'number' ? parsed.expiresAt : null,
    } satisfies AuthSessionRecord;
  } catch {
    await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
    return null;
  }
}

export async function persistSession(session: AuthSessionRecord | null) {
  if (!session) {
    await SecureStore.deleteItemAsync(AUTH_SESSION_KEY);
    return;
  }

  await SecureStore.setItemAsync(AUTH_SESSION_KEY, JSON.stringify(session));
}