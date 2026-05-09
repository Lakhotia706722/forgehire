'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="font-mono text-8xl font-bold text-[rgba(239,68,68,0.15)] mb-4 select-none" aria-hidden="true">
          500
        </p>
        <h1 className="font-display text-2xl font-bold text-text-primary mb-3">
          Something went wrong
        </h1>
        <p className="text-text-secondary text-sm leading-relaxed mb-8">
          An unexpected error occurred. Our team has been notified.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center h-11 px-6 rounded-lg bg-accent-cyan text-bg-base font-semibold text-sm hover:brightness-110 transition-all"
          >
            Try Again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center h-11 px-6 rounded-lg border border-[rgba(255,255,255,0.1)] text-text-secondary text-sm hover:text-text-primary transition-all"
          >
            Go Home
          </a>
        </div>
        {error.digest && (
          <p className="mt-6 text-xs font-mono text-text-muted">Error ID: {error.digest}</p>
        )}
      </div>
    </div>
  );
}
