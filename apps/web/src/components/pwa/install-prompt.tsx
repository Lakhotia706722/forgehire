'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Custom PWA install prompt.
 * - Shows after the user's 2nd visit (tracked in localStorage)
 * - Bottom slide-up sheet on mobile, top banner on desktop
 * - Remembers dismissal in localStorage
 */

const VISIT_COUNT_KEY = 'nh_visit_count';
const DISMISSED_KEY = 'nh_install_dismissed';
const INSTALLED_KEY = 'nh_install_done';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [show, setShow] = React.useState(false);
  const [isMobile, setIsMobile] = React.useState(false);
  const [deferredPrompt, setDeferredPrompt] = React.useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = React.useState(false);

  React.useEffect(() => {
    // Don't show if already installed or dismissed
    if (
      typeof window === 'undefined' ||
      localStorage.getItem(DISMISSED_KEY) ||
      localStorage.getItem(INSTALLED_KEY) ||
      window.matchMedia('(display-mode: standalone)').matches
    ) {
      return;
    }

    // Track visit count
    const count = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10) + 1;
    localStorage.setItem(VISIT_COUNT_KEY, String(count));

    setIsMobile(window.innerWidth < 768);

    // Capture the browser's install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show our custom prompt on 2nd+ visit
      if (count >= 2) {
        setTimeout(() => setShow(true), 1500);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // Also show on 2nd visit even if prompt already fired
    if (count >= 2) {
      setTimeout(() => setShow(true), 1500);
    }

    // Track successful install
    window.addEventListener('appinstalled', () => {
      localStorage.setItem(INSTALLED_KEY, '1');
      setShow(false);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    setInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem(INSTALLED_KEY, '1');
      }
    } finally {
      setInstalling(false);
      setShow(false);
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    localStorage.setItem(DISMISSED_KEY, '1');
    setShow(false);
  }

  if (!show) return null;

  // ── Mobile: bottom slide-up sheet ──────────────────────────
  if (isMobile) {
    return (
      <div
        role="dialog"
        aria-label="Install NeuronHire app"
        aria-modal="false"
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50',
          'bg-bg-elevated border-t border-[rgba(255,255,255,0.08)]',
          'rounded-t-2xl px-5 py-6 shadow-2xl',
          'animate-[slide-up_300ms_cubic-bezier(0.16,1,0.3,1)_both]'
        )}
        style={{ animation: 'slideUp 300ms cubic-bezier(0.16,1,0.3,1) both' }}
      >
        <style>{`
          @keyframes slideUp {
            from { transform: translateY(100%); opacity: 0; }
            to   { transform: translateY(0);    opacity: 1; }
          }
        `}</style>

        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-[rgba(255,255,255,0.15)] mx-auto mb-5" aria-hidden="true" />

        <div className="flex items-start gap-4">
          {/* App icon */}
          <div className="w-14 h-14 rounded-2xl bg-accent-cyan flex items-center justify-center shrink-0" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="#080B14" strokeWidth="1.5" strokeLinejoin="round"/>
              <circle cx="8" cy="8" r="2" fill="#080B14"/>
            </svg>
          </div>

          <div className="flex-1 min-w-0">
            <p className="font-display font-bold text-text-primary text-base">Add NeuronHire</p>
            <p className="text-text-muted text-sm mt-0.5">Install for faster access and offline support</p>
          </div>
        </div>

        <div className="flex gap-3 mt-5">
          <button
            onClick={handleInstall}
            disabled={installing}
            className="flex-1 py-3 rounded-xl bg-accent-cyan text-bg-base font-semibold text-sm hover:brightness-110 active:scale-[0.97] transition-all disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-bg-elevated"
          >
            {installing ? 'Installing…' : 'Add to Home Screen'}
          </button>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
            className="px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] text-text-secondary text-sm hover:text-text-primary hover:border-[rgba(255,255,255,0.15)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-bg-elevated"
          >
            Not now
          </button>
        </div>
      </div>
    );
  }

  // ── Desktop: top banner ────────────────────────────────────
  return (
    <div
      role="banner"
      aria-label="Install NeuronHire app"
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'bg-bg-elevated border-b border-[rgba(0,212,255,0.2)]',
        'px-4 py-3 flex items-center justify-between gap-4',
        'shadow-[0_4px_24px_rgba(0,0,0,0.4)]'
      )}
      style={{ animation: 'slideDown 300ms cubic-bezier(0.16,1,0.3,1) both' }}
    >
      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);     opacity: 1; }
        }
      `}</style>

      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-accent-cyan flex items-center justify-center shrink-0" aria-hidden="true">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" stroke="#080B14" strokeWidth="1.5" strokeLinejoin="round"/>
            <circle cx="8" cy="8" r="2" fill="#080B14"/>
          </svg>
        </div>
        <div>
          <span className="text-sm font-semibold text-text-primary">Install NeuronHire</span>
          <span className="text-sm text-text-muted ml-2">for faster access and offline support</span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstall}
          disabled={installing}
          className="px-4 py-1.5 rounded-lg bg-accent-cyan text-bg-base font-semibold text-sm hover:brightness-110 active:scale-[0.97] transition-all disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-bg-elevated"
        >
          {installing ? 'Installing…' : 'Install'}
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss install banner"
          className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-[rgba(255,255,255,0.05)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M1 1l14 14M15 1L1 15"/>
          </svg>
        </button>
      </div>
    </div>
  );
}
