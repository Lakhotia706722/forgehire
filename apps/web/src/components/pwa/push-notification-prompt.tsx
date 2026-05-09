'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * Custom push notification permission prompt.
 * Shows BEFORE the browser's native prompt to improve acceptance rate.
 * Triggered at high-intent moments (e.g., after passing assessment).
 *
 * Usage:
 *   const { requestPermission } = usePushNotifications();
 *   // Call requestPermission() at the right moment
 */

interface PushNotificationPromptProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
  /** Context for why we're asking — shown in the prompt */
  reason?: string;
}

export function PushNotificationPrompt({
  open,
  onClose,
  onAccept,
  onDecline,
  reason = 'Get notified about new bounties, payments, and messages.',
}: PushNotificationPromptProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Custom push notification permission prompt"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-bg-elevated border border-[rgba(255,255,255,0.08)] rounded-2xl shadow-2xl animate-fade-up p-6">
        {/* Bell icon */}
        <div className="w-14 h-14 rounded-2xl bg-[rgba(0,212,255,0.1)] border border-[rgba(0,212,255,0.2)] flex items-center justify-center mx-auto mb-5" aria-hidden="true">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00D4FF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </div>

        <h2 id="push-prompt-title" className="font-display font-bold text-text-primary text-lg text-center mb-2">
          Stay in the loop
        </h2>
        <p className="text-text-secondary text-sm text-center mb-6 leading-relaxed">
          {reason}
        </p>

        {/* Notification previews */}
        <div className="space-y-2 mb-6">
          {[
            { icon: '💰', text: 'New bounty: Voice AI Agent — ₹50,000' },
            { icon: '✅', text: 'Payment released: ₹25,000 from Sarvam AI' },
            { icon: '💬', text: 'New message from Priya at Zepto' },
          ].map((item) => (
            <div
              key={item.text}
              className="flex items-center gap-3 p-3 bg-bg-surface rounded-xl border border-[rgba(255,255,255,0.04)]"
            >
              <span className="text-base" aria-hidden="true">{item.icon}</span>
              <p className="text-xs text-text-secondary">{item.text}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onAccept}
            className="flex-1 py-3 rounded-xl bg-accent-cyan text-bg-base font-semibold text-sm hover:brightness-110 active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-bg-elevated"
          >
            Enable Notifications
          </button>
          <button
            onClick={onDecline}
            className="px-4 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] text-text-secondary text-sm hover:text-text-primary hover:border-[rgba(255,255,255,0.15)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan focus-visible:ring-offset-2 focus-visible:ring-offset-bg-elevated"
          >
            Not now
          </button>
        </div>

        <p className="text-xs text-text-muted text-center mt-4">
          You can change this anytime in Settings → Notifications
        </p>
      </div>
    </div>
  );
}

/**
 * Hook for managing push notification permission flow.
 */
export function usePushNotifications() {
  const [permission, setPermission] = React.useState<NotificationPermission>('default');
  const [showPrompt, setShowPrompt] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  /** Call this at a high-intent moment to show the custom pre-prompt */
  function requestPermission() {
    if (permission === 'granted' || permission === 'denied') return;
    setShowPrompt(true);
  }

  async function handleAccept() {
    setShowPrompt(false);
    if (!('Notification' in window)) return;

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === 'granted') {
        await subscribeToPush();
      }
    } catch (err) {
      console.error('Push permission error:', err);
    }
  }

  function handleDecline() {
    setShowPrompt(false);
  }

  return {
    permission,
    showPrompt,
    requestPermission,
    handleAccept,
    handleDecline,
    closePrompt: () => setShowPrompt(false),
  };
}

/**
 * Subscribe to Web Push API and send subscription to server.
 */
async function subscribeToPush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    const registration = await navigator.serviceWorker.ready;
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) return;

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    // Send subscription to backend
    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });
  } catch (err) {
    console.error('Push subscription error:', err);
  }
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
