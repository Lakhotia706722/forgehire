'use client';

import * as React from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { formatReward } from '@/lib/bounty-data';

interface NewBountyNotification {
  id: string;
  title: string;
  reward: number;
  currency: string;
}

interface NewBountyToastProps {
  notification: NewBountyNotification | null;
  onDismiss: () => void;
}

export function NewBountyToast({ notification, onDismiss }: NewBountyToastProps) {
  React.useEffect(() => {
    if (!notification) return;
    const t = setTimeout(onDismiss, 8000);
    return () => clearTimeout(t);
  }, [notification, onDismiss]);

  if (!notification) return null;

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50',
        'bg-bg-elevated border border-[rgba(0,212,255,0.2)] rounded-xl shadow-2xl',
        'p-4 max-w-sm w-full',
        'animate-slide-in-right'
      )}
      role="alert"
      aria-live="polite"
      data-testid="new-bounty-toast"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-8 h-8 rounded-lg bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="#00D4FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="8" cy="8" r="6"/>
            <path d="M8 5v3l2 2"/>
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-accent-cyan mb-0.5">New matching bounty</p>
          <p className="text-sm text-text-primary font-medium leading-snug line-clamp-2 mb-1">
            {notification.title}
          </p>
          <p className="text-xs font-mono text-accent-amber">
            {formatReward(notification.reward, notification.currency)}
          </p>
        </div>

        {/* Dismiss */}
        <button
          onClick={onDismiss}
          className="text-text-muted hover:text-text-primary transition-colors shrink-0"
          aria-label="Dismiss notification"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
            <path d="M1 1l12 12M13 1L1 13"/>
          </svg>
        </button>
      </div>

      {/* View button */}
      <div className="mt-3 flex gap-2">
        <Link
          href={`/engineer/bounties/${notification.id}`}
          className="flex-1 text-center text-xs py-2 rounded-lg bg-accent-cyan text-bg-base font-semibold hover:brightness-110 transition-all"
          data-testid="new-bounty-view-link"
          onClick={onDismiss}
        >
          View Bounty
        </Link>
        <button
          onClick={onDismiss}
          className="px-3 text-xs text-text-muted hover:text-text-secondary transition-colors"
        >
          Later
        </button>
      </div>
    </div>
  );
}

/**
 * Hook that simulates WebSocket new-bounty notifications.
 * In production, replace with a real WebSocket connection.
 */
export function useNewBountyNotifications(engineerSkills: string[]) {
  const [notification, setNotification] = React.useState<NewBountyNotification | null>(null);

  React.useEffect(() => {
    // Simulate a WebSocket message arriving after 5 seconds
    const t = setTimeout(() => {
      setNotification({
        id: 'b-new-1',
        title: 'Build RAG Pipeline for E-commerce Search',
        reward: 95000,
        currency: 'INR',
      });
    }, 5000);

    return () => clearTimeout(t);
  }, []);

  return {
    notification,
    dismiss: () => setNotification(null),
  };
}
