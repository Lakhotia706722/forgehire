'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications } from '@/lib/api-hooks';

const TYPE_ICON: Record<string, string> = {
  submission: '📥',
  contract: '📄',
  message: '💬',
  payment: '💰',
  system: '⚡',
};

const TYPE_ICON_CLASS: Record<string, string> = {
  submission: 'notif-icon-submission',
  contract: 'notif-icon-contract',
  message: 'notif-icon-message',
  payment: 'notif-icon-payment',
  system: 'notif-icon-system',
};

function formatTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CompanyNotificationsPage() {
  const { data: items = [], isLoading } = useNotifications();
  const [readIds, setReadIds] = React.useState<Set<string>>(new Set());

  const notifications = items.map((n) => ({
    ...n,
    read: n.read || readIds.has(n.id),
    icon: TYPE_ICON[n.type] ?? '🔔',
    time: formatTime(n.createdAt),
  }));

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setReadIds(new Set(notifications.map((n) => n.id)));
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary">Notifications</h1>
            {unreadCount > 0 && <p className="text-text-secondary text-sm mt-1">{unreadCount} unread</p>}
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-sm text-accent-cyan hover:underline">
              Mark all read
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-4 flex gap-3">
                <Skeleton circle className="w-10 h-10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-16 text-text-muted text-sm">No notifications yet</div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const iconClass = TYPE_ICON_CLASS[notif.type] ?? 'notif-icon-system';
              return (
                <a
                  key={notif.id}
                  href={notif.href ?? '#'}
                  onClick={() => setReadIds((prev) => new Set(prev).add(notif.id))}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-xl border transition-all',
                    'hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.02)]',
                    notif.read
                      ? 'bg-bg-surface border-[rgba(255,255,255,0.06)]'
                      : 'bg-bg-elevated border-[rgba(123,94,167,0.15)]',
                  )}
                >
                  <div
                    className={cn('w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0', iconClass)}
                    aria-hidden="true"
                  >
                    {notif.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-medium', notif.read ? 'text-text-secondary' : 'text-text-primary')}>
                        {notif.title}
                      </p>
                      {!notif.read && <span className="w-2 h-2 rounded-full bg-accent-violet shrink-0 mt-1.5" aria-label="Unread" />}
                    </div>
                    <p className="text-xs text-text-muted mt-0.5 leading-relaxed">{notif.body}</p>
                    <p className="text-[10px] text-text-muted font-mono mt-1.5">{notif.time}</p>
                  </div>
                </a>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
