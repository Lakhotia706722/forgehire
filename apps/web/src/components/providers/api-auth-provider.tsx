'use client';

import * as React from 'react';
import { useAuth } from '@clerk/nextjs';
import { useQueryClient } from '@tanstack/react-query';
import { API_BASE, extractApiErrorMessage } from '@/lib/api-fetch';

export type ApiAuthStatus = 'loading' | 'ready' | 'failed';

type ApiAuthContextValue = {
  status: ApiAuthStatus;
  error: string | null;
  retrySync: () => void;
};

const ApiAuthContext = React.createContext<ApiAuthContextValue>({
  status: 'loading',
  error: null,
  retrySync: () => {},
});

export function useApiAuth() {
  return React.useContext(ApiAuthContext);
}

/**
 * After Clerk sign-in, exchange the Clerk session JWT for Forge API tokens
 * stored in localStorage (used by apiFetch / axios).
 */
export function ApiAuthProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const queryClient = useQueryClient();
  const syncingRef = React.useRef(false);
  const [status, setStatus] = React.useState<ApiAuthStatus>('loading');
  const [error, setError] = React.useState<string | null>(null);
  const [syncTick, setSyncTick] = React.useState(0);

  const retrySync = React.useCallback(() => {
    setSyncTick((n) => n + 1);
  }, []);

  React.useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setStatus('ready');
      setError(null);
      return;
    }

    if (syncingRef.current) return;

    const sync = async () => {
      syncingRef.current = true;
      setStatus('loading');
      setError(null);

      try {
        const clerkToken = await getToken();
        if (!clerkToken) {
          setStatus('failed');
          setError('Could not read your Clerk session. Try signing out and back in.');
          return;
        }

        const res = await fetch(`${API_BASE}/api/auth/clerk-session`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${clerkToken}`,
            'Content-Type': 'application/json',
          },
          body: '{}',
          credentials: 'include',
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setStatus('failed');
          setError(extractApiErrorMessage(body, `API auth failed (${res.status})`));
          return;
        }

        const json = await res.json();
        const data = json.data ?? json;
        if (!data?.accessToken) {
          setStatus('failed');
          setError('API did not return an access token.');
          return;
        }

        localStorage.setItem('accessToken', data.accessToken);
        if (data.refreshToken) {
          localStorage.setItem('refreshToken', data.refreshToken);
        }

        setStatus('ready');
        setError(null);
        await queryClient.invalidateQueries();
      } catch (err) {
        setStatus('failed');
        setError(
          err instanceof Error
            ? err.message
            : 'Cannot reach the API. Is it running on port 3001?',
        );
      } finally {
        syncingRef.current = false;
      }
    };

    void sync();
  }, [isLoaded, isSignedIn, getToken, queryClient, syncTick]);

  const value = React.useMemo(
    () => ({ status, error, retrySync }),
    [status, error, retrySync],
  );

  return <ApiAuthContext.Provider value={value}>{children}</ApiAuthContext.Provider>;
}
