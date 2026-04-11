import Constants from 'expo-constants';
import { Platform } from 'react-native';

const expoExtra = (Constants.expoConfig?.extra ?? {}) as {
  apiBaseUrl?: string;
};

const getExpoHost = () => {
  const expoHost =
    Constants.expoConfig?.hostUri
    ?? Constants.linkingUri
    ?? '';
  const trimmed = expoHost.trim();

  if (!trimmed) {
    return null;
  }

  const withoutScheme = trimmed.replace(/^[a-z]+:\/\//i, '');
  const [host] = withoutScheme.split(':');

  return host?.trim() || null;
};

const fallbackApiBaseUrl = () => {
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:3000';
  }

  const expoHost = getExpoHost();

  if (expoHost && expoHost !== 'localhost' && expoHost !== '127.0.0.1') {
    return `http://${expoHost}:3000`;
  }

  return 'http://localhost:3000';
};

const normalizeBaseUrl = (value?: string | null) => {
  const normalized = value?.trim().replace(/\/$/, '');

  return normalized ? normalized : null;
};

export const API_BASE_URL = normalizeBaseUrl(
  process.env.EXPO_PUBLIC_API_BASE_URL
    ?? expoExtra.apiBaseUrl
    ?? fallbackApiBaseUrl(),
) ?? 'http://localhost:3000';

export const SESSION_COOKIE_NAME = 'trading_sid';
export const SUMMARY_POLL_INTERVAL_MS = 5000;
