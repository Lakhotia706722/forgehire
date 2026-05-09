'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminDisputes } from '@/lib/api-hooks';

function formatGMV(n: number): string {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}K`;
  return `₹${n}`;
}

export default function AdminDisputesPage() {
  const { data, isLoading } = useAdminDisputes();
  const [reviewing, setReviewing] = React.useState<any | null>(null);
  const [localResolved, setLocalResolved] = React.useState<Set<string>>(new Set());

  const disputes = (data?.disputes ?? []).filter(d => !localResolved.has(d.id));
  const activeCount = disputes.filter(d => d.status !== 'resolved').length;

  function handleResolve(id: string, engineerPct: number, notes: string) {
    setLocalResolved(prev => new Set([...prev, id]));
    setReviewing(null);
  }

  const statusBadge = (status: string) => {
    if (status === 'open' || status === 'pending') return <Badge variant="red">Open</Badge>;
    if (status === 'under_review') return <Badge variant="amber">Under Review</Badge>;
    return <Badge variant="green">Resolved</Badge>;
  };

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary mb-1">Dispute Management</h1>
          <p className="text-text-secondary text-sm">{activeCount} active disputes</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-3">
                <Skeleton className="h-5 w-64" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-16 rounded-xl" />
              </div>
            ))}
          </div>
        ) : disputes.length === 0 ? (
          <div className="bg-bg-surface border border-[rgba(255,255,255,0.06)] rounded-2xl p-12 text-center">
            <p className="text-text-muted text-sm">No disputes found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => (
              <div
                key={dispute.id}
                className={cn(
                  'bg-bg-surface border rounded-2xl p-5',
                  dispute.status === 'open' || dispute.status === 'pending'
                    ? 'border-[rgba(239,68,68,0.2)]'
                    : dispute.status === 'under_review'
                    ? 'border-[rgba(245,158,11,0.2)]'
                    : 'border-[rgba(255,255,255,0.06)]'
                )}
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-display font-semibold text-text-primary">{dispute.contractTitle}</h2>
                      {statusBadge(dispute.status)}
                    </div>
                    <p className="text-sm text-text-muted">
                      {dispute.engineerName} ↔ {dispute.companyName} · Contract value: {formatGMV(dispute.contractValue)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-text-muted">{dispute.daysOpen} day{dispute.daysOpen !== 1 ? 's' : ''} open</p>
                  </div>
                </div>

                <p className="text-sm text-text-secondary mb-4 p-3 bg-bg-elevated rounded-xl border border-[rgba(255,255,255,0.04)]">
                  <strong className="text-text-primary">Reason:</strong> {dispute.reason}
                </p>

                {dispute.status !== 'resolved' && (
                  <button
                    onClick={() => setReviewing(dispute)}
                    className="px-4 py-2 rounded-xl bg-accent-cyan text-bg-base font-semibold text-sm hover:brightness-110 transition-all"
                    data-testid={`review-dispute-${dispute.id}`}
                  >
                    Review Dispute
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {reviewing && (
        <DisputeReviewModal
          dispute={reviewing}
          onClose={() => setReviewing(null)}
          onResolve={handleResolve}
        />
      )}
    </div>
  );
}


function DisputeReviewModal({
  dispute,
  onClose,
  onResolve,
}: {
  dispute: any;
  onClose: () => void;
  onResolve: (id: string, engineerPct: number, notes: string) => void;
}) {
  const [engineerPct, setEngineerPct] = React.useState(70);
  const [notes, setNotes] = React.useState('');
  const companyPct = 100 - engineerPct;
  const contractValue = dispute.contractValue ?? 0;
  const engineerAmount = Math.round((contractValue * engineerPct) / 100);
  const companyAmount = contractValue - engineerAmount;

  return (
    <Modal open title={`Dispute: ${dispute.contractTitle}`} onClose={onClose} size="lg">
      <div className="p-6 space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 bg-bg-elevated rounded-xl">
            <p className="text-xs text-text-muted mb-1">Engineer</p>
            <p className="text-sm font-semibold text-text-primary">{dispute.engineerName}</p>
          </div>
          <div className="p-4 bg-bg-elevated rounded-xl">
            <p className="text-xs text-text-muted mb-1">Company</p>
            <p className="text-sm font-semibold text-text-primary">{dispute.companyName}</p>
          </div>
        </div>

        <div className="p-4 bg-[rgba(0,212,255,0.04)] border border-[rgba(0,212,255,0.15)] rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm" aria-hidden="true">🤖</span>
            <h3 className="text-sm font-semibold text-accent-cyan">AI Audit Report</h3>
          </div>
          <p className="text-sm text-text-secondary leading-relaxed">{dispute.reason}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-text-primary mb-3">Resolution</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-text-muted mb-2">
                Engineer receives: <strong className="text-accent-green">{engineerPct}%</strong> (₹{engineerAmount.toLocaleString('en-IN')})
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={engineerPct}
                onChange={(e) => setEngineerPct(Number(e.target.value))}
                className="w-full accent-accent-cyan"
                aria-label="Engineer payment percentage"
                data-testid="engineer-pct-slider"
              />
              <div className="flex justify-between text-xs text-text-muted mt-1">
                <span>Engineer: {engineerPct}% (₹{engineerAmount.toLocaleString('en-IN')})</span>
                <span>Company: {companyPct}% (₹{companyAmount.toLocaleString('en-IN')})</span>
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-muted mb-2">Decision Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Explain the resolution decision…"
                className="w-full bg-bg-elevated border border-[rgba(255,255,255,0.06)] rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-[rgba(0,212,255,0.3)] resize-none"
                data-testid="dispute-notes"
              />
            </div>
          </div>
        </div>

        <button
          onClick={() => onResolve(dispute.id, engineerPct, notes)}
          disabled={!notes.trim()}
          className="w-full py-3 rounded-xl bg-accent-green text-white font-semibold text-sm hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          data-testid="release-funds-btn"
        >
          Release Funds &amp; Resolve Dispute
        </button>
      </div>
    </Modal>
  );
}
