'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';

interface TabWarningProps {
  count: number;
  onReturn: () => void;
}

export function TabSwitchWarning({ count, onReturn }: TabWarningProps) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(239,68,68,0.15)', backdropFilter: 'blur(4px)' }}
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="tab-warning-title"
    >
      <div className="bg-bg-elevated border border-[rgba(239,68,68,0.4)] rounded-2xl p-8 max-w-md w-full mx-6 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.3)] flex items-center justify-center mx-auto">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>

        <div>
          <h2 id="tab-warning-title" className="font-display text-xl font-bold text-accent-red mb-2">
            Tab Switch Detected
          </h2>
          <p className="text-text-secondary text-sm">
            Warning {count} of 3. Switching tabs during the assessment is not allowed.
            A third violation will result in automatic submission.
          </p>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={onReturn}
          data-testid="return-to-test-btn"
        >
          Return to Test
        </Button>
      </div>
    </div>
  );
}

interface InactivityWarningProps {
  secondsLeft: number;
  onDismiss: () => void;
}

export function InactivityWarning({ secondsLeft, onDismiss }: InactivityWarningProps) {
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  const formatted = `${m}:${String(s).padStart(2, '0')}`;

  return (
    <div
      className="fixed top-16 left-1/2 -translate-x-1/2 z-50 animate-slide-in-right"
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-bg-elevated border border-[rgba(245,158,11,0.3)] rounded-xl px-5 py-3 flex items-center gap-4 shadow-xl">
        <svg width="16" height="16" viewBox="0 0 20 20" fill="#F59E0B" aria-hidden="true">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
        </svg>
        <p className="text-sm text-text-secondary">
          Are you still there? Test will auto-submit in{' '}
          <span className="font-mono font-semibold text-accent-amber">{formatted}</span>
        </p>
        <button
          onClick={onDismiss}
          className="text-xs text-accent-cyan hover:underline ml-2"
        >
          I&apos;m here
        </button>
      </div>
    </div>
  );
}

export function CopyPasteToast() {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 animate-fade-up"
      role="status"
      aria-live="polite"
    >
      <div className="bg-bg-elevated border border-[rgba(239,68,68,0.3)] rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-xl">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="#EF4444" aria-hidden="true">
          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clipRule="evenodd"/>
        </svg>
        <span className="text-xs text-text-secondary">Copy-paste is disabled during assessment</span>
      </div>
    </div>
  );
}
