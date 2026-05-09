'use client';

import { Toaster as Sonner } from 'sonner';

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      toastOptions={{
        style: {
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--text-primary)',
          fontFamily: 'var(--font-body)',
          fontSize: '14px',
        },
        classNames: {
          success: 'toast-success',
          error:   'toast-error',
          info:    'toast-info',
        },
      }}
      richColors={false}
      closeButton
    />
  );
}

// Re-export toast for convenience
export { toast } from 'sonner';
