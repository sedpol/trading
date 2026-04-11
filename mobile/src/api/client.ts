import { API_BASE_URL } from '../config';

type RequestOptions = {
  body?: unknown;
  headers?: Record<string, string>;
  method?: 'GET' | 'POST';
  token?: string;
};

type ErrorPayload = {
  message?: string | string[];
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly payload?: unknown,
  ) {
    super(message);
  }
}

export async function readJsonSafely<T>(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers ?? {}),
  };

  if (options.token?.trim()) {
    headers.Authorization = `Bearer ${options.token.trim()}`;
  }

  if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const payload = await readJsonSafely<T | ErrorPayload>(response);

  if (!response.ok) {
    const errorPayload = payload as ErrorPayload | null;
    const message = Array.isArray(errorPayload?.message)
      ? errorPayload?.message.join(', ')
      : errorPayload?.message ?? `Request failed with status ${response.status}.`;

    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}