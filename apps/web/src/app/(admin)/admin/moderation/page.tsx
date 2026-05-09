'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { MOCK_MODERATION_QUEUE, type ModerationItem, type ModerationStatus, type ModerationContentType } from '@/lib/admin-data';

export default function AdminModerationPage() {
  const [items, setItems] = React.useState<ModerationItem[]>(MOCK_MODERATION_QUEUE);
  const [typeFilter, setTypeFilter] = React.useState<ModerationContentType | 'all'>('all');

  const filtered = items.filter((item) =>
    (typeFilter === 'all' || item.contentType === typeFilter) && item.status === 'pending'
  );

  function handleAction(id: string, action: 'approved' | 'removed' | 'warned') {
    setItems((prev) => prev.map((item) => item.id === id ? { ...item, status: action as ModerationStatus } : item));
  }

  const contentTypeBadge = (type: ModerationContentType) => {
    const variants: Record<ModerationContentType, 'cyan' | 'violet' | 'amber' | 'gray'> = {
      profile: 'cyan', product: 'violet', review: 'amber', message: 'gray',
    };
    return <Badge variant={variants[type]}>{type}</Badge>;
  };

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary mb-1">Moderation Queue</h1>
          <p className="text-text-secondary text-sm">
            {filtered.length} items pending review · Flagged by OpenAI Moderation API
          </p>
        </div>

        {/* Filter */}
        <div className="flex gap-2" role="group" aria-label="Filter by content type">
          {(['all', 'profile', 'product', 'review', 'message'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setTypeFilter(f)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan',
                typeFilter === f
                  ? 'bg-accent-cyan text-bg-base'
                  : 'bg-bg-surface text-text-secondary hover:text-text-primary border border-[rgba(255,255,255,0.06)]'
              )}
              aria-pressed={typeFilter === f}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4" aria-hidden="true">✅</p>
            <p className="text-text-primary font-semibold">Queue is clear</p>
            <p className="text-text-muted text-sm mt-1">No pending moderation items</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-5"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {contentTypeBadge(item.contentType)}
                    {item.flags.map((flag) => (
                      <span
                        key={flag}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-[rgba(239,68,68,0.1)] text-accent-red border border-[rgba(239,68,68,0.2)]"
                      >
                        {flag.replace('_', ' ')}
                      </span>
                    ))}
                    <span className="text-xs text-text-muted">
                      Confidence: <strong className="text-accent-amber">{Math.round(item.confidence * 100)}%</strong>
                    </span>
                  </div>
                  <span className="text-xs text-text-muted shrink-0">{item.flaggedAt}</span>
                </div>

                <div className="mb-3">
                  <p className="text-xs text-text-muted mb-1">
                    By <strong className="text-text-secondary">{item.authorName}</strong> ({item.authorEmail})
                  </p>
                  <div className="p-3 bg-bg-elevated rounded-xl border border-[rgba(255,255,255,0.04)]">
                    <p className="text-sm text-text-secondary leading-relaxed">&ldquo;{item.content}&rdquo;</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(item.id, 'approved')}
                    className="px-4 py-2 rounded-xl bg-accent-green text-white text-xs font-semibold hover:brightness-110 active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
                    data-testid={`approve-mod-${item.id}`}
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => handleAction(item.id, 'removed')}
                    className="px-4 py-2 rounded-xl bg-accent-red text-white text-xs font-semibold hover:brightness-110 active:scale-[0.97] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
                    data-testid={`remove-mod-${item.id}`}
                  >
                    ✗ Remove
                  </button>
                  <button
                    onClick={() => handleAction(item.id, 'warned')}
                    className="px-4 py-2 rounded-xl bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.3)] text-accent-amber text-xs font-semibold hover:bg-[rgba(245,158,11,0.15)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
                    data-testid={`warn-mod-${item.id}`}
                  >
                    ⚠ Warn User
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
