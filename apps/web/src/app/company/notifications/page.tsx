'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const MOCK_NOTIFICATIONS = [
  { id: 'n1', type: 'submission', icon: '📥', title: 'New submission received',    body: 'Arjun Sharma submitted work for Voice AI Agent bounty',    time: '1 hour ago',   read: false, href: '/company/tasks/t1/submissions' },
  { id: 'n2', type: 'contract',   icon: '📄', title: 'Contract signed',            body: 'Priya Menon has signed the RAG Pipeline contract',         time: '3 hours ago',  read: false, href: '/company/contracts' },
  { id: 'n3', type: 'message',    icon: '💬', title: 'New message',                body: 'Rahul Kumar sent you a message about the ML Engineer role', time: '5 hours ago',  read: false, href: '/company/messages' },
  { id: 'n4', type: 'payment',    icon: '💰', title: 'Escrow deposited',           body: 'Escrow of ₹1,50,000 confirmed for Voice AI Agent bounty',  time: '1 day ago',    read: true,  href: '/company/billing' },
  { id: 'n5', type: 'system',     icon: '⚡', title: 'Trust score updated',        body: 'Your company trust score increased to 87/100',             time: '2 days ago',   read: true,  href: '/company/profile' },
];

const TYPE_COLOR: Record<string, string> = {
  submission: '#00D4FF',
  contract:   '#7B5EA7',
  message:    '#10B981',
  payment:    '#F59E0B',
  system:     '#8892A4',
};

export default function CompanyNotificationsPage() {
  const [notifications, setNotifications] = React.useState(MOCK_NOTIFICATIONS);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const t = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(t);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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

        {loading ? (
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
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const color = TYPE_COLOR[notif.type] ?? '#8892A4';
              return (
                <a
                  key={notif.id}
                  href={notif.href ?? '#'}
                  onClick={() => setNotifications((prev) => prev.map((n) => n.id === notif.id ? { ...n, read: true } : n))}
                  className={cn(
                    'flex items-start gap-4 p-4 rounded-xl border transition-all',
                    'hover:border-[rgba(255,255,255,0.1)] hover:bg-[rgba(255,255,255,0.02)]',
                    notif.read
                      ? 'bg-bg-surface border-[rgba(255,255,255,0.06)]'
                      : 'bg-bg-elevated border-[rgba(123,94,167,0.15)]'
                  )}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: `${color}15`, border: `1px solid ${color}25` }} aria-hidden="true">
                    {notif.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={cn('text-sm font-medium', notif.read ? 'text-text-secondary' : 'text-text-primary')}>{notif.title}</p>
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
