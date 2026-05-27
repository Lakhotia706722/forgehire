/**
 * Shared fetch helper for API calls from client components.
 * Unwraps `{ success, data }` responses from the Fastify API.
 */

import { asArray } from './api-safe';

export const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';

export { asArray } from './api-safe';

type ApiErrorBody = {
  message?: string;
  error?: string | {
    code?: string;
    message?: string;
    details?: Array<{ field?: string; message?: string }>;
  };
};

/** Turn Fastify `{ success, error: { code, message } }` bodies into a display string. */
export function extractApiErrorMessage(
  body: unknown,
  fallback = 'Request failed',
): string {
  if (!body || typeof body !== 'object') return fallback;
  const b = body as ApiErrorBody;
  if (typeof b.message === 'string' && b.message) return b.message;
  const err = b.error;
  if (typeof err === 'string' && err) return err;
  if (err && typeof err === 'object') {
    const details = err.details;
    if (Array.isArray(details) && details.length > 0) {
      const parts = details
        .map((d) => {
          const field = d.field ? `${d.field}: ` : '';
          return `${field}${d.message ?? 'invalid'}`;
        })
        .filter(Boolean);
      if (parts.length) return parts.join(' · ');
    }
    if (typeof err.message === 'string' && err.message) return err.message;
    if (typeof err.code === 'string' && err.code) return err.code;
  }
  return fallback;
}

/** List fetch that never throws — returns [] on failure. */
export async function apiFetchList<T>(path: string, options?: RequestInit): Promise<T[]> {
  try {
    const result = await apiFetch<unknown>(path, options);
    return asArray<T>(result);
  } catch {
    return [];
  }
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    credentials: 'include',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(extractApiErrorMessage(err, `API error ${res.status}`));
  }

  const json = await res.json();
  if (json && typeof json === 'object' && json.success === true && 'data' in json) {
    return json.data as T;
  }
  return json as T;
}
