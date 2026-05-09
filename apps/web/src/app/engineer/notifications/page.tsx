'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { useNotifications } from '@/lib/api-hooks';

type NotifType = 'payment' | 'message' | 'contract' | 'bounty' | 'system';

const TYPE_ICON: Record<string, { icon: string; color: string }> = {
  payment:  { icon: '💰', color: '#10B981' },
  message:  { icon: '💬', color: '#00D4FF' },
  contract: { icon: '📄', color: '#7B5EA7' },
  bounty:   { icon: '🎯', color: '#F59E0B' },
  system:   { icon: '⚡', color: '#8892A4' },
};

export default function NotificationsPage() {
  const { data: apiNotifications, isLoading } = useNotifications();
  const [readIds, setReadIds] = React.useState<Set<string>>(new Set());

  const notifications = (apiNotifications ?? []).map(n => ({
    ...n,
    read: n.read || readIds.has(n.id),
    time: new Date(n.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
  }));

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setReadIds(new Set(notifications.map(n => n.id)));
  }

  function markRead(id: string) {
    setReadIds(prev => new Set([...prev, id]));
  }

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-text-primary">Notifications</h1>
            {unreadCount > 0 && (
              <p className="text-text-secondary text-sm mt-1">{unreadCount} unread</p>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-sm text-accent-cyan hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-xl p-4 flex gap-3">
                <Skeleton circle className="w-10 h-10 shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-text-muted text-sm">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const { icon, color } = TYPE_ICON[notif.type];
              return (
                <a
                  key={notif.id}
                  href={notif.href ?? '#'}
                  onClick={() => markRead(notif.id)}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-xl border transition-all duration-150',
                    'hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.02)]',
                    notif.read
                      ? 'bg-bg-surface border-[rgba(255,255,255,0.06)]'
                      : 'bg-bg-elevated border-[rgba(0,212,255,0.1)]'
                  )}
                >
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0"
                    style={{ background: `${color}15`, border: `1px solid ${color}25` }}
                    aria-hidden="true"
                  >
                    {icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-medium', notif.read ? 'text-text-secondary' : 'text-text-primary')}>
                        {notif.title}
                      </p>
                      {!notif.read && (
                        <span className="w-2 h-2 rounded-full bg-accent-cyan shrink-0 mt-1.5" aria-label="Unread" />
                      )}
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
