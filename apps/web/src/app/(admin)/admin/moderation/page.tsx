'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminModerationQueue, useAdminProductDecision } from '@/lib/api-hooks';
import type { ModerationContentType, ModerationStatus } from '@/lib/admin-data';
import { AriaToggleButton } from '@/components/ui/aria-tab-button';

export default function AdminModerationPage() {
  const { data, isLoading } = useAdminModerationQueue();
  const productDecision = useAdminProductDecision();
  const [typeFilter, setTypeFilter] = React.useState<ModerationContentType | 'all'>('all');
  const [resolved, setResolved] = React.useState<Set<string>>(new Set());

  const items = (data?.products ?? [])
    .filter((p) => !resolved.has(p.id))
    .map((p) => ({
      id: p.id,
      contentType: 'product' as ModerationContentType,
      title: p.name,
      submittedBy: p.engineerProfile?.fullName ?? p.user?.email ?? 'Unknown',
      submittedAt: p.createdAt,
      status: 'pending' as ModerationStatus,
      flags: ['pending_review'],
      preview: p.tagline,
    }));

  const filtered = items.filter(
    (item) => (typeFilter === 'all' || item.contentType === typeFilter) && item.status === 'pending',
  );

  async function handleAction(id: string, action: 'approved' | 'removed' | 'warned') {
    const decision = action === 'approved' ? 'approve' : action === 'removed' ? 'reject' : 'request_changes';
    await productDecision.mutateAsync({ productId: id, decision, notes: `Moderation: ${action}` });
    setResolved((prev) => new Set(prev).add(id));
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
            {isLoading ? '...' : `${filtered.length} products pending review`}
          </p>
        </div>

        <div className="flex gap-2" role="group" aria-label="Filter by content type">
          {(['all', 'product'] as const).map((f) => (
            <AriaToggleButton
              key={f}
              pressed={typeFilter === f}
              onClick={() => setTypeFilter(f === 'product' ? 'product' : 'all')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan',
                (typeFilter === f || (f === 'all' && typeFilter === 'all'))
                  ? 'bg-accent-cyan text-bg-base'
                  : 'bg-bg-surface text-text-secondary hover:text-text-primary border border-[rgba(255,255,255,0.06)]',
              )}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </AriaToggleButton>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
          </div>
        ) : filtered.length === 0 ? (
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
                      by {item.submittedBy} · {new Date(item.submittedAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                </div>
                <h3 className="font-display font-semibold text-text-primary mb-1">{item.title}</h3>
                <p className="text-sm text-text-secondary mb-4">{item.preview}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(item.id, 'approved')}
                    className="px-4 py-2 rounded-lg text-xs font-medium bg-accent-green text-bg-base hover:opacity-90 transition-opacity"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(item.id, 'removed')}
                    className="px-4 py-2 rounded-lg text-xs font-medium bg-accent-red/10 text-accent-red border border-[rgba(239,68,68,0.2)] hover:bg-accent-red/20 transition-colors"
                  >
                    Reject
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
